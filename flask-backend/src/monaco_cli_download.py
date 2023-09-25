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
    return dirs.get_tenant_data_cache_sub_dir(config, "monaco_logs")


def get_path_entities(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "ent_mon")


def get_path_configs(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "conf_mon")


def extract_entities(run_info, tenant_key):
    options_prefix = ["download", "entities"]
    options_suffix = []
    if run_info["time_from_minutes"] != None:
        options_suffix.append("--time-from-minutes")
        options_suffix.append(run_info["time_from_minutes"])
    if run_info["time_to_minutes"] != None:
        options_suffix.append("--time-to-minutes")
        options_suffix.append(run_info["time_to_minutes"])
    get_path_func = get_path_entities
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
):
    result = {}
    call_result = {}

    config = credentials.get_api_call_credentials(tenant_key)
    path = get_path_func(config)

    log_file_path = terraform_cli.add_timestamp_to_log_filename(
        path, "monaco_download_" + log_label + ".log"
    )

    delete_cache_func(config, path)

    log_file_path = terraform_cli.add_timestamp_to_log_filename(
        get_path_monaco_logs(config), "monaco_download_" + log_label + ".log"
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

    try:
        monaco_exec_dir = dirs.get_monaco_exec_dir()
        print(
            "Downloading",
            log_label,
            "using Monaco, see ",
            log_file_path,
        )
        print("NEED TO TEST THIS CHANGE ON WINDOWS!!!")

        cmd_list = [f"{monaco_exec_dir}/{command}"] + options
        commands = sub_process_helper.create_shell_command(cmd_list, monaco_exec_dir)

        call_result = subprocess.run(
            commands,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            shell=True,
            env=my_env,
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
    ):
        print(log_label, "downloaded successfully")
        result["monaco_finished"] = True
        monaco_cli.save_finished(path)
    else:
        monaco_cli.handle_subprocess_error(
            run_info, result, command, options, stdout, stderr, ("Extract" + log_label)
        )

    return result


def delete_old_cache_entities(config, path):
    non_monaco_dir = "entities_list"

    delete_old_cache(config, path, non_monaco_dir)


def delete_old_cache_configs(config, path):
    non_monaco_dir = "objects"

    delete_old_cache(config, path, non_monaco_dir)


def delete_old_cache(config, path, non_monaco_dir):
    is_previous_finished, _ = monaco_cli.is_finished(path)

    if is_previous_finished:
        print("Deleting old Monaco cache: ", path)
        try:
            shutil.rmtree(path)
        except FileNotFoundError as e:
            dirs.print_path_too_long_message_cond(path)
            raise e
    else:
        non_monaco_cache_path = dirs.get_tenant_data_cache_sub_dir(
            config, non_monaco_dir
        )

        if os.path.exists(non_monaco_cache_path) and os.path.isdir(
            non_monaco_cache_path
        ):
            print("Deleting pre-Monaco cache: ", non_monaco_cache_path)
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

    is_finished, _ = monaco_cli.is_finished(get_path_func(config))

    return is_finished
