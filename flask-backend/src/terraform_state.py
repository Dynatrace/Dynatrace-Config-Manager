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

import shutil
import json

import credentials
import dirs
import monaco_local_entity
import terraform_cli
import terraform_local
import terraform_ui_util

STATE_FILENAME = "terraform.tfstate"
STATE_ID_CACHE = "cache_prev_state"


def get_path_state_id_cache(config_main, config_target):
    return dirs.prep_dir(
        dirs.get_tenant_work_cache_sub_dir(config_main, config_target, STATE_ID_CACHE)
    )


def merge_state_into_config(tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    copy_state(
        terraform_cli.get_path_terraform_state_gen(config_main, config_target),
        terraform_cli.get_path_terraform_config(config_main, config_target),
    )


def keep_state_for_IDs(tenant_key_main, tenant_key_target, tenant_key):
    try:
        config_main = credentials.get_api_call_credentials(tenant_key_main)
        config_target = credentials.get_api_call_credentials(tenant_key_target)

        copy_state(
            terraform_cli.get_path_terraform_config(config_main, config_target),
            get_path_state_id_cache(config_main, config_target),
            get_keyed_state_file_name(tenant_key),
        )
    except Exception as e:
        print("INFO: Could not keep state for IDs, could be also be first run.")


def get_keyed_state_file_path(config_main, config_target, tenant_key):
    return dirs.forward_slash_join(
        get_path_state_id_cache(config_main, config_target),
        get_keyed_state_file_name(tenant_key),
    )


def get_keyed_state_file_name(tenant_key):
    return f"{tenant_key}-{STATE_FILENAME}"


def copy_state(path_from, path_to, dest_statefile=STATE_FILENAME):
    shutil.copy2(
        dirs.forward_slash_join(
            path_from,
            STATE_FILENAME,
        ),
        dirs.forward_slash_join(
            path_to,
            dest_statefile,
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

    if state_multi_backup is None:
        return False

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

    with open(dest_path, "w", encoding="UTF-8") as f:
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
