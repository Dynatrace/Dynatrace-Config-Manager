import dirs
import json
import os

import credentials
import terraform_cli
import terraform_ui_util
import util_remove_ansi

HISTORY_DIR = "history"
HISTORY_FILE = "history"
COMPLETE_DIR = "complete"
TARGETED_DIR = "targeted"


def get_path_history(config_main, config_target):
    return dirs.prep_dir(
        terraform_cli.get_path_terraform(config_main, config_target), HISTORY_DIR
    )


def get_terraform_history_log_path(run_info, is_targeted, config_main, config_target):
    log_path = ""
    if is_targeted:
        log_path = get_path_history_targeted(run_info, config_main, config_target)
    else:
        log_path = get_path_history_complete(run_info, config_main, config_target)

    return log_path


def get_path_history_complete(run_info, config_main, config_target):
    return dirs.prep_dir(
        get_path_history(config_main, config_target),
        COMPLETE_DIR,
        (run_info["action_id"]),
    )


def get_path_history_targeted(run_info, config_main, config_target):
    return dirs.prep_dir(
        get_path_history(config_main, config_target),
        TARGETED_DIR,
        (run_info["action_id"]),
    )


def get_history_file(tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)
    return dirs.get_file_path(
        get_path_history(config_main, config_target), HISTORY_FILE
    )


def load_history_configs(tenant_key_main, tenant_key_target):
    history_configs = {}
    try:
        with open(get_history_file(tenant_key_main, tenant_key_target), "r", encoding='UTF-8') as file:
            history_configs = json.load(file)
    except:
        pass

    return history_configs


def save_history_configs(tenant_key_main, tenant_key_target, payload):
    with open(get_history_file(tenant_key_main, tenant_key_target), "w", encoding='UTF-8') as file:
        file.write(json.dumps(payload))


def count_files_in_subdirectories(path):
    if not os.path.isdir(path):
        raise ValueError("Provided path is not a directory.")

    subdirectories = [
        subdir
        for subdir in os.listdir(path)
        if os.path.isdir(os.path.join(path, subdir))
    ]
    result = {}

    for subdir in subdirectories:
        subdir_path = os.path.join(path, subdir)
        files_in_subdir = [
            f
            for f in os.listdir(subdir_path)
            if os.path.isfile(os.path.join(subdir_path, f))
        ]
        result[subdir] = len(files_in_subdir)

    return result


def load_history_list(tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    operations_complete = extract_operation_info(
        config_main, config_target, COMPLETE_DIR, "Plan All"
    )
    operations_targeted = extract_operation_info(
        config_main, config_target, TARGETED_DIR, "Targeted"
    )

    sorted_history_list = sorted(
        operations_complete + operations_targeted,
        key=lambda item: item["name"],
        reverse=True,
    )

    return sorted_history_list


def extract_operation_info(config_main, config_target, history_type, history_label):
    path = dirs.prep_dir(get_path_history(config_main, config_target), history_type)

    operations = []

    for subdir in os.listdir(path):
        sub_dir_path = os.path.join(path, subdir)
        if os.path.isdir(sub_dir_path):
            nb_logs, is_post_process = count_dir_files(sub_dir_path)
            if nb_logs > 0:
                used_type = history_label
                if is_post_process:
                    used_type = "Post-Process"

                operations.append(
                    {
                        "name": subdir,
                        "type": history_type,
                        "sub_type": used_type,
                        "nb_logs": nb_logs,
                    }
                )

    return operations


def count_dir_files(sub_dir_path):
    nb_logs = 0
    is_post_process = False

    for file in os.listdir(sub_dir_path):
        file_path = os.path.join(sub_dir_path, file)
        if os.path.isfile(file_path):
            if file_path.endswith("import.log"):
                is_post_process = True
            nb_logs += 1

    return nb_logs, is_post_process


def load_history_item(tenant_key_main, tenant_key_target, history_type, history_name):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = dirs.prep_dir(
        get_path_history(config_main, config_target), history_type, history_name
    )

    list = []

    for file in os.listdir(path):
        file_path = os.path.join(path, file)

        if(terraform_cli.CLEANED_SUFFIX in file_path):
            continue
        
        if os.path.isfile(file_path):
            list.append(file)

    sorted_item_list = sorted(
        list,
        key=lambda item: item,
        reverse=True,
    )
    return sorted_item_list


def load_history_item_log(
    tenant_key_main, tenant_key_target, history_type, history_name, log
):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = dirs.prep_dir(
        get_path_history(config_main, config_target), history_type, history_name
    )

    log_path = dirs.get_file_path(path, log, "")

    log_dict = {}

    if get_is_terraform_execute(log):
        log_content, log_content_cleaned = util_remove_ansi.remove_ansi_colors(
            None, log_path, False, "", ""
        )

        log_dict = terraform_ui_util.create_dict_from_terraform_log(
            log_content, log_content_cleaned
        )
        
        print("Need to write some temporary UI Payloads!!")
        #ui_payload = terraform_local.write_UI_payloads(
        #tenant_key_main, tenant_key_target, log_dict

    else:
        with open(log_path, "r", encoding="UTF-8") as f:
            log_dict["lines"] = f.readlines()

    return log_dict


def get_is_terraform_execute(log):
    
    is_terraform_execute = ("_plan" in log or "_apply" in log)
    if(".http." in log):
        is_terraform_execute = False
        
    return is_terraform_execute


def open_history_item_log_vscode(
    tenant_key_main, tenant_key_target, history_type, history_name, log
):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = dirs.prep_dir(
        get_path_history(config_main, config_target), history_type, history_name
    )

    log_path = dirs.get_file_path(path, log, "")

    terraform_cli.open_in_vscode(path, log_path)
