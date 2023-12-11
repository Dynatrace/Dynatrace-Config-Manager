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
import subprocess
import yaml

import credentials
import copy
import dirs
import monaco_cli
import monaco_cli_download
import monaco_local_entity
import shutil
import process_utils
import tenant
import sub_process_helper
import terraform_cli
import terraform_history


def get_path_match_entities(config_main, config_target):
    return dirs.get_tenant_work_cache_sub_dir(config_main, config_target, "mat_ent_mon")


def get_path_match_entities_prev(config_main, config_target):
    return dirs.get_tenant_work_cache_sub_dir(
        config_main, config_target, "cache_prev_mat_ent"
    )


def get_path_match_configs(config_main, config_target):
    return dirs.get_tenant_work_cache_sub_dir(
        config_main, config_target, "mat_conf_mon"
    )


def get_path_match_configs_prev(config_main, config_target):
    return dirs.get_tenant_work_cache_sub_dir(
        config_main, config_target, "cache_prev_mat_conf"
    )


def get_path_match_entities_results(config_main, config_target):
    return dirs.prep_dir(get_path_match_entities(config_main, config_target), "results")


def get_path_match_entities_results_only(config_main, config_target):
    return get_path_match_entities_results(config_main, config_target)


def get_path_match_entities_results_only_prev(config_main, config_target):
    return dirs.forward_slash_join(
        get_path_match_entities_prev(config_main, config_target), "results"
    )


def get_path_match_configs_results(config_main, config_target):
    return dirs.prep_dir(get_path_match_configs(config_main, config_target), "results")


def get_path_match_configs_results_only(config_main, config_target):
    return dirs.prep_dir(
        get_path_match_configs(config_main, config_target), "results", "dict"
    )


def get_path_match_configs_results_only_prev(config_main, config_target):
    return dirs.forward_slash_join(
        get_path_match_configs_prev(config_main, config_target), "results", "dict"
    )


def get_path_match_configs_UI_payload(config_main, config_target):
    return dirs.prep_dir(
        get_path_match_configs_results(config_main, config_target), "UIPayload"
    )


def get_path_match_entities_yaml(config_main, config_target):
    return dirs.get_file_path(
        get_path_match_entities(config_main, config_target), "match", ".yaml"
    )


def get_path_match_configs_yaml(config_main, config_target):
    return dirs.get_file_path(
        get_path_match_configs(config_main, config_target), "match", ".yaml"
    )


def is_finished_match_entities(tenant_key_target, tenant_key_main=None):
    match_type = "entities"

    return is_finished_match(match_type, tenant_key_target, tenant_key_main)


def is_finished_match_configs(tenant_key_target, tenant_key_main=None):
    match_type = "configs"

    return is_finished_match(match_type, tenant_key_target, tenant_key_main)


def is_finished_match(match_type, tenant_key_target, tenant_key_main):
    if tenant_key_main == None:
        tenant_key_main = tenant_key_target

    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    is_finished, finished_file, _ = monaco_cli.is_finished(
        match_type_options[match_type]["cache_path_func"](config_main, config_target)
    )

    return (
        is_finished
        and "tenant_key_target" in finished_file
        and finished_file["tenant_key_target"] == tenant_key_target
        and "tenant_key_main" in finished_file
        and finished_file["tenant_key_main"] == tenant_key_main
    )


def match_entities(run_info, tenant_key_target, tenant_key_main=None):
    match_type = "entities"

    return match(run_info, match_type, tenant_key_target, tenant_key_main)


def match_configs(run_info, tenant_key_target, tenant_key_main=None):
    match_type = "configs"

    return match(run_info, match_type, tenant_key_target, tenant_key_main)


match_type_options = {
    "entities": {
        "cache_path_func": get_path_match_entities,
        "output_path_func": get_path_match_entities_results,
        "result_path_func": get_path_match_entities_results_only,
        "result_path_func_prev": get_path_match_entities_results_only_prev,
        "manifest_path_func": monaco_cli_download.get_path_entities,
        "yaml_path_func": get_path_match_entities_yaml,
        "entities_match_path_func": None,
        "is_finished_func": monaco_cli_download.is_finished_entities,
        "is_finished_match_func": is_finished_match_entities,
        "load_match_func": monaco_local_entity.load_matched_entities,
        "match_func": match_entities,
    },
    "configs": {
        "cache_path_func": get_path_match_configs,
        "output_path_func": get_path_match_configs_results,
        "result_path_func": get_path_match_configs_results_only,
        "result_path_func_prev": get_path_match_configs_results_only_prev,
        "manifest_path_func": monaco_cli_download.get_path_configs,
        "yaml_path_func": get_path_match_configs_yaml,
        "entities_match_path_func": get_path_match_entities_results,
        "is_finished_func": monaco_cli_download.is_finished_configs,
        "is_finished_match_func": is_finished_match_configs,
        "load_match_func": monaco_local_entity.load_matched_configs,
        "match_func": match_configs,
    },
}


def match(run_info, match_type, tenant_key_target, tenant_key_main=None):
    result = {}
    call_result = {}

    if tenant_key_main == None:
        tenant_key_main = tenant_key_target

    config_target = credentials.get_api_call_credentials(tenant_key_target)
    config_main = credentials.get_api_call_credentials(tenant_key_main)

    delete_old_cache(config_main, config_target, match_type)

    match_yaml_path = save_match_yaml(run_info, config_target, config_main, match_type)

    command = monaco_cli.MONACO_EXEC
    options = ["match", match_yaml_path]

    tenant_data = tenant.load_tenant(tenant_key_target)

    history_log_path = terraform_history.get_terraform_history_log_path(
        run_info, False, config_main, config_target
    )
    log_file_path = terraform_cli.add_timestamp_to_log_filename(
        history_log_path, "one_topology_" + match_type + ".log"
    )

    my_env = monaco_cli.gen_monaco_env(config_target, tenant_data, log_file_path)

    try:
        monaco_exec_dir = dirs.get_monaco_exec_dir()
        print(
            "Match",
            match_type,
            "using OneTopology, see ",
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

    if "Finished matching" in stderr:
        print("Match completed successfully")
        result["monaco_finished"] = True

        finished_file = {
            "tenant_key_main": tenant_key_main,
            "tenant_key_target": tenant_key_target,
        }

        copy_missing_match_types_from_older_extract(
            config_main, config_target, match_type
        )

        copy_missing_match_types_from_older_extract(
            config_main, config_target, match_type
        )

        monaco_cli.save_finished(
            match_type_options[match_type]["cache_path_func"](
                config_main, config_target
            ),
            finished_file,
            "match",
            match_type,
        )
    else:
        monaco_cli.handle_subprocess_error(
            run_info, result, command, options, stdout, stderr, ("Match " + match_type)
        )

    return result


def delete_old_cache(config_main, config_target, match_type):
    monaco_cache_path = match_type_options[match_type]["cache_path_func"](
        config_main, config_target
    )

    keep_monaco_results_from_older_extract(config_main, config_target, match_type)

    if os.path.exists(monaco_cache_path) and os.path.isdir(monaco_cache_path):
        print("Deleting expired OneTopology cache: ", monaco_cache_path)
        shutil.rmtree(monaco_cache_path)


def keep_monaco_results_from_older_extract(config_main, config_target, match_type):
    monaco_cache_output = match_type_options[match_type]["result_path_func"](
        config_main, config_target
    )
    monaco_cache_output_prev = match_type_options[match_type]["result_path_func_prev"](
        config_main, config_target
    )

    try:
        shutil.copytree(
            monaco_cache_output,
            monaco_cache_output_prev,
            copy_function=shutil.copy2,
            dirs_exist_ok=True,
        )

    except Exception as e:
        print(
            f"INFO1: Could not keep previous {match_type} matching results, could be also be first run."
        )
        print(f"INFO2: {e}")


def copy_missing_match_types_from_older_extract(config_main, config_target, match_type):
    monaco_cache_output_prev = match_type_options[match_type]["result_path_func_prev"](
        config_main, config_target
    )
    monaco_cache_output = match_type_options[match_type]["result_path_func"](
        config_main, config_target
    )

    if os.path.exists(monaco_cache_output_prev):
        pass
    else:
        return

    try:
        os.makedirs(monaco_cache_output, exist_ok=True)

        for file in os.listdir(monaco_cache_output_prev):
            source_path = os.path.join(monaco_cache_output_prev, file)
            destination_path = os.path.join(monaco_cache_output, file)

            if os.path.exists(destination_path):
                pass
            else:
                shutil.copy2(source_path, destination_path)

    except Exception as e:
        print(f"INFO: Problem copying previous match {match_type} results", e)


"""
"prevResultPath": match_type_options[match_type]["result_path_func_prev"](
    config_main, config_target
),
"""


def save_match_yaml(run_info, config_target, config_main, match_type):
    match_config = {
        "name": "match",
        "type": match_type,
        "outputPath": match_type_options[match_type]["output_path_func"](
            config_main, config_target
        ),
        "sourceInfo": {
            "manifestPath": dirs.get_file_path(
                match_type_options[match_type]["manifest_path_func"](config_main),
                "manifest",
                ".yaml",
            ),
            "project": monaco_cli.PROJECT_NAME,
            "environment": monaco_cli.PROJECT_NAME,
        },
        "targetInfo": {
            "manifestPath": dirs.get_file_path(
                match_type_options[match_type]["manifest_path_func"](config_target),
                "manifest",
                ".yaml",
            ),
            "project": monaco_cli.PROJECT_NAME,
            "environment": monaco_cli.PROJECT_NAME,
        },
    }

    if match_type_options[match_type]["entities_match_path_func"] is None:
        pass
    else:
        match_config["entitiesMatchPath"] = match_type_options[match_type][
            "entities_match_path_func"
        ](config_main, config_target)

    if match_type == "configs":
        if run_info["forced_schema_id"] != None and run_info["forced_schema_id"] != "":
            match_config["skipSpecificTypes"] = False
            match_config["specificTypes"] = [run_info["forced_schema_id"]]
        else:
            print("DEBUG DO NOT COMMIT!!!")
            print("DEBUG DO NOT COMMIT!!!")
            print("DEBUG DO NOT COMMIT!!!")
            print("DEBUG DO NOT COMMIT!!!")
            print("DEBUG DO NOT COMMIT!!!")
            print("DEBUG DO NOT COMMIT!!!")
            print("DEBUG DO NOT COMMIT!!!")
            match_config["skipSpecificTypes"] = True
            match_config["specificTypes"] = ["builtin:host.monitoring"]
            pass
            # print("Skip Dashboards for better performance")
            # print("TODO: Add Toggle in the UI")
            # match_config["skipSpecificTypes"] = True
            # match_config["specificTypes"] = ["dashboard"]

        if (
            run_info["forced_keep_action_only"] != None
            and run_info["forced_keep_action_only"]
        ):
            match_config["specificActions"] = []
            for action, enabled in run_info["forced_keep_action_only"].items():
                if enabled:
                    match_config["specificActions"].append(action)

    match_yaml_path = match_type_options[match_type]["yaml_path_func"](
        config_main, config_target
    )

    with open(match_yaml_path, "w", encoding="UTF-8") as f:
        f.write(yaml.dump(match_config))

    return match_yaml_path


def try_monaco_match_entities(run_info, tenant_key_main, tenant_key_target):
    match_type = "entities"

    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    delete_old_cache(config_main, config_target, match_type)

    run_legacy_match, result_tuple = try_monaco_match(
        run_info, match_type, tenant_key_main, tenant_key_target
    )
    (matched_entities_dict, entities_dict) = result_tuple

    return run_legacy_match, matched_entities_dict, entities_dict


def try_monaco_match_configs(run_info, tenant_key_main, tenant_key_target):
    match_type = "configs"

    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    delete_old_cache(config_main, config_target, match_type)

    run_legacy_match, result_tuple = try_monaco_match(
        run_info, match_type, tenant_key_main, tenant_key_target
    )
    (flat_result_table) = result_tuple

    return run_legacy_match, flat_result_table


def try_monaco_match(run_info, match_type, tenant_key_main, tenant_key_target):
    result_tuple = ({}, {})
    run_legacy_match = True

    if run_info["preemptive_config_copy"] == True or run_info["forced_match"] == True:
        return run_legacy_match, result_tuple

    if (
        match_type_options[match_type]["is_finished_func"](tenant_key=tenant_key_main)
        == True
        and match_type_options[match_type]["is_finished_func"](
            tenant_key=tenant_key_target
        )
        == True
    ):
        must_rerun = False

        if match_type_options[match_type]["is_finished_match_func"](
            tenant_key_target, tenant_key_main
        ):
            print("Attempt to load OneTopology cache")
            must_rerun, result_tuple = match_type_options[match_type][
                "load_match_func"
            ](tenant_key_target, tenant_key_main)

            if must_rerun == False:
                print("Loaded OneTopology cache successfully")
                run_legacy_match = False
            else:
                print("Loaded OneTopology cache was out of date")
        else:
            print("No OneTopology cache available")
            must_rerun = True

        if must_rerun == True:
            print("Run OneTopology Matching")

            run_info_local = copy.deepcopy(run_info)
            run_info_local["aggregate_error"] = []
            run_info_local["return_status"] = 200

            match_type_options[match_type]["match_func"](
                run_info_local, tenant_key_target, tenant_key_main
            )
            print("OneTopology Match Output: ", run_info_local)

            if match_type_options[match_type]["is_finished_match_func"](
                tenant_key_target, tenant_key_main
            ):
                must_rerun, result_tuple = match_type_options[match_type][
                    "load_match_func"
                ](tenant_key_target, tenant_key_main)

                if must_rerun == False:
                    print("Ran OneTopology successfully")
                    run_legacy_match = False
                else:
                    print("Attempt to run OneTopology failed")
            else:
                print("Attempt to run OneTopology failed")

    return run_legacy_match, result_tuple
