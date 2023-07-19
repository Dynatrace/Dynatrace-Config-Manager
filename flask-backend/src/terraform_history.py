import dirs
import json
import credentials
import terraform_cli

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
        with open(get_history_file(tenant_key_main, tenant_key_target), "r") as file:
            history_configs = json.load(file)
    except:
        pass

    return history_configs


def save_history_configs(tenant_key_main, tenant_key_target, payload):
    with open(get_history_file(tenant_key_main, tenant_key_target), "w") as file:
        file.write(json.dumps(payload))
