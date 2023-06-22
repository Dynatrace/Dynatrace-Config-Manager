import shutil
import json

import credentials
import dirs
import monaco_local_entity
import terraform_cli
import terraform_local
import terraform_ui_util

state_filename = "terraform.tfstate"


def merge_state_into_config(tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    shutil.copy2(
        dirs.forward_slash_join(
            terraform_cli.get_path_terraform_state_gen(config_main, config_target),
            state_filename,
        ),
        dirs.forward_slash_join(
            terraform_cli.get_path_terraform_config(config_main, config_target),
            state_filename,
        ),
    )


def update_state_with_multi_target_state(run_info, tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    state_multi_backup = load_state(
        config_main,
        config_target,
        terraform_local.get_path_terraform_multi_target,
        backup=True,
    )

    module_to_remove = {}

    if ("resources") in state_multi_backup:
        pass
    else:
        return False

    for resource in state_multi_backup["resources"]:
        type_trimmed = terraform_ui_util.trim_module_name(resource["type"])
        name = resource["name"]

        if type_trimmed in module_to_remove:
            pass
        else:
            module_to_remove[type_trimmed] = {"unique_names": []}

        module_to_remove[type_trimmed]["unique_names"].append(name)

    def remove_multi_targeted(type_trimmed, name):
        if (
            type_trimmed in module_to_remove
            and name in module_to_remove[type_trimmed]["unique_names"]
        ):
            return True

        return False

    state = remove_items_from_state(
        tenant_key_main,
        tenant_key_target,
        terraform_cli.get_path_terraform_config,
        remove_multi_targeted,
    )

    state_multi = load_state(
        config_main, config_target, terraform_local.get_path_terraform_multi_target
    )

    state["resources"].extend(state_multi["resources"])

    write_state(
        terraform_cli.get_path_terraform_config, config_main, config_target, state
    )


def remove_items_from_state(
    tenant_key_main,
    tenant_key_target,
    path_func_src,
    to_be_removed_func,
    path_func_dest=None,
):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    state = load_state(config_main, config_target, path_func_src)
    new_resources = []

    if ("resources") in state:
        pass
    else:
        return False

    for resource in state["resources"]:
        type_trimmed = terraform_ui_util.trim_module_name(resource["type"])
        name = resource["name"]
        if to_be_removed_func(type_trimmed, name):
            continue

        new_resources.append(resource)

    state["resources"] = new_resources

    if path_func_dest is not None:
        write_state(path_func_dest, config_main, config_target, state)
        return True

    return state


def write_state(path_func_dest, config_main, config_target, state):
    dest_path = dirs.forward_slash_join(
        path_func_dest(config_main, config_target), "terraform.tfstate"
    )

    with open(dest_path, "w") as f:
        f.write(json.dumps(state))


def load_state(config_main, config_target, path_func, backup=False):
    state_file_name = "terraform.tfstate"
    if backup is True:
        state_file_name += ".backup"

    path = dirs.forward_slash_join(
        path_func(config_main, config_target), state_file_name
    )

    state = monaco_local_entity.get_cached_data(path, file_expected=False)

    return state
