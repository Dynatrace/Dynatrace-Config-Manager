import os
import shutil

import credentials
import dirs
import monaco_local_entity
import terraform_cli

state_filename = "terraform.tfstate"


def merge_state_into_config(tenant_key_target):
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    shutil.copy2(
        dirs.forward_slash_join(
            terraform_cli.get_path_terraform_state_gen(config_target), state_filename
        ),
        dirs.forward_slash_join(
            terraform_cli.get_path_terraform_config(config_target), state_filename
        ),
    )


def get_address_map(tenant_key_target):
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    address_state_gen = load_address_map(
        config_target, terraform_cli.get_path_terraform_state_gen
    )
    address_config = load_address_map(
        config_target, terraform_cli.get_path_terraform_config
    )

    for schema, idMap in address_config.items():
        if schema in address_state_gen:
            address_state_gen[schema].update(idMap)
        else:
            address_state_gen[schema] = idMap

    return address_state_gen


def load_address_map(config, path_func):
    address_path = dirs.forward_slash_join(path_func(config), "address.json")

    address_map = monaco_local_entity.get_cached_data(address_path, file_expected=False)

    return address_map
