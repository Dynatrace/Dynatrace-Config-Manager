# Copyright 2023 Dynatrace LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#      https://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os
import shutil
import subprocess

import credentials
import dirs
import monaco_cli
import process_utils
import sub_process_helper
import tenant
import terraform_cli


def get_path_monaco_logs(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "extraction_cli_logs")


def get_path_entities(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "ent_mon")


def get_path_configs(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "conf_mon")


def get_path_test_connection(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "test_connection")


def get_path_test_connection_logs(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "test_connection_logs")


def extract_entities(run_info, tenant_key):
    options_prefix = ["download", "entities"]
    options_suffix = []
    if run_info["time_from_minutes"] != None:
        options_suffix.append("--time-from-minutes")
        options_suffix.append(run_info["time_from_minutes"])
    if run_info["time_to_minutes"] != None:
        options_suffix.append("--time-to-minutes")
        options_suffix.append(run_info["time_to_minutes"])

    def add_to_finished(finished):
        if run_info["time_from_minutes"] != None:
            finished["time_from_minutes"] = run_info["time_from_minutes"]
        if run_info["time_to_minutes"] != None:
            finished["time_to_minutes"] = run_info["time_to_minutes"]

        return finished

    get_path_func = get_path_entities
    get_path_logs_func = get_path_monaco_logs
    delete_cache_func = delete_old_cache_entities
    log_label = "entities"

    result = extract(
        run_info,
        tenant_key,
        options_prefix,
        options_suffix,
        get_path_func,
        delete_cache_func,
        log_label,
        add_to_finished=add_to_finished,
        get_path_logs_func=get_path_logs_func,
    )

    return result


def test_connection(run_info, tenant_key):
    options_prefix = ["download", "entities"]
    options_suffix = []

    def add_to_finished(finished):
        return finished

    options_suffix.append("--specific-types")
    options_suffix.append("ENVIRONMENT")
    get_path_func = get_path_test_connection
    get_path_logs_func = get_path_test_connection_logs
    delete_cache_func = delete_old_cache_test_connection
    log_label = "test_connection"

    result = extract(
        run_info,
        tenant_key,
        options_prefix,
        options_suffix,
        get_path_func,
        delete_cache_func,
        log_label,
        add_to_finished=add_to_finished,
        get_path_logs_func=get_path_logs_func,
    )

    return result


def extract_configs(run_info, tenant_key):
    options_prefix = ["download"]
    options_suffix = ["--flat-dump"]
    get_path_func = get_path_configs
    delete_cache_func = delete_old_cache_configs
    log_label = "configs"

    result = extract(
        run_info,
        tenant_key,
        options_prefix,
        options_suffix,
        get_path_func,
        delete_cache_func,
        log_label,
    )

    return result


def extract(
    run_info,
    tenant_key,
    options_prefix,
    options_suffix,
    get_path_func,
    delete_cache_func,
    log_label,
    add_to_finished=None,
    get_path_logs_func=get_path_monaco_logs,
):
    config = credentials.get_api_call_credentials(tenant_key)
    path = get_path_func(config)

    delete_cache_func(config, path)

    log_file_path = terraform_cli.add_timestamp_to_log_filename(
        get_path_logs_func(config), "extraction_cli_download_" + log_label + ".log"
    )

    tenant_data = tenant.load_tenant(tenant_key)
    my_env = monaco_cli.gen_monaco_env(config, tenant_data, log_file_path)

    command = monaco_cli.MONACO_EXEC
    options = options_prefix
    options.extend(
        [
            "direct",
            tenant_data["url"],
            monaco_cli.TOKEN_NAME,
            "-o",
            path,
            "-f",
            "-p",
            monaco_cli.PROJECT_NAME,
        ]
    )

    if len(options_suffix) > 0:
        options.extend(options_suffix)

    return exec_one_topology(
        run_info,
        command,
        my_env,
        log_label,
        log_file_path,
        options,
        tenant_key,
        path,
        add_to_finished,
    )


def exec_one_topology(
    run_info,
    command,
    my_env,
    log_label,
    log_file_path,
    options=[],
    tenant_key=None,
    path=None,
    add_to_finished=None,
):
    result = {}
    call_result = {}

    try:
        monaco_exec_dir = dirs.get_monaco_exec_dir()
        print(
            "Downloading",
            log_label,
            "using Extraction cli, see ",
            log_file_path,
        )

        cmd_list = [f"{monaco_exec_dir}/{command}"] + options

        commands, cwd = sub_process_helper.create_shell_command(
            cmd_list, monaco_exec_dir
        )

        call_result = subprocess.run(
            commands,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            shell=True,
            env=my_env,
            cwd=cwd,
        )

    except subprocess.CalledProcessError as error:
        print(f"The command {error.cmd} failed with error code {error.returncode}")
        process_utils.add_aggregate_error(
            run_info,
            f"The command {error.cmd} failed with error code {error.returncode}",
        )
        run_info["return_status"] = 400
        return result

    stdout = call_result.stdout.decode()
    stderr = call_result.stderr.decode()

    if (
        "Finished download" in stderr
        and not "Failed to fetch all known entities types" in stderr
        and not "Failed to fetch all known schemas" in stderr
    ):
        print(log_label, "downloaded successfully")
        result["monaco_finished"] = True

        if tenant_key is None:
            pass
        else:
            finished_file = None
            finished_file = {"tenant_key": tenant_key}

            if add_to_finished is None:
                pass
            else:
                finished_file = add_to_finished(finished_file)

            monaco_cli.save_finished(path, finished_file, "download", log_label)
    elif "Tool used to deploy dynatrace configurations via the cli" in stdout:
        run_info["return_status"] = 200
    else:
        monaco_cli.handle_subprocess_error(
            run_info, result, command, options, stdout, stderr, ("Extract" + log_label)
        )

    return result


def delete_old_cache_test_connection(config, path):
    delete_old_cache(config, path)


def delete_old_cache_entities(config, path):
    non_monaco_dir = "entities_list"

    delete_old_cache(config, path, non_monaco_dir)


def delete_old_cache_configs(config, path):
    non_monaco_dir = "objects"

    delete_old_cache(config, path, non_monaco_dir)


def delete_old_cache(config, path, non_monaco_dir=None):
    _, _, can_delete = monaco_cli.is_finished(path)

    if can_delete:
        print("Deleting old Extraction cli cache: ", path)
        try:
            shutil.rmtree(path)
        except FileNotFoundError as e:
            dirs.print_path_too_long_message_cond(path)
            raise e
    elif non_monaco_dir is not None:
        non_monaco_cache_path = dirs.get_tenant_data_cache_sub_dir(
            config, non_monaco_dir
        )

        if os.path.exists(non_monaco_cache_path) and os.path.isdir(
            non_monaco_cache_path
        ):
            print("Deleting pre-Extraction cache: ", non_monaco_cache_path)
            shutil.rmtree(non_monaco_cache_path)


def is_finished_configs(config=None, tenant_key=None):
    is_finished = is_finished_download(get_path_configs, config, tenant_key)

    return is_finished


def is_finished_entities(config=None, tenant_key=None):
    is_finished = is_finished_download(get_path_entities, config, tenant_key)

    return is_finished


def is_finished_download(get_path_func, config=None, tenant_key=None):
    if config == None:
        config = credentials.get_api_call_credentials(tenant_key)

    is_finished, _, _ = monaco_cli.is_finished(get_path_func(config))

    return is_finished


def get_finished_download_configs(tenant_key):
    return get_finished_download(get_path_configs, tenant_key=tenant_key)


def get_finished_download_entities(tenant_key):
    return get_finished_download(get_path_entities, tenant_key=tenant_key)


def get_finished_download(get_path_func, config=None, tenant_key=None):
    if config == None:
        config = credentials.get_api_call_credentials(tenant_key)

    return monaco_cli.load_finished(get_path_func(config))
