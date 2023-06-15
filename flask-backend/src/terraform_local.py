import shutil

import credentials
import dirs
import json
import monaco_local_entity
import process_migrate_config
import terraform_cli

state_filename = "terraform.tfstate"
OVERALL_DIFF_DIR = "overall"
UI_PAYLOAD_FILENAME = "uiPayload"


def get_path_overall_diff(config_main, config_target):
    return dirs.prep_dir(
        dirs.get_tenant_work_cache_sub_dir(config_main, config_target, OVERALL_DIFF_DIR)
    )


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


def get_address_map(tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    address_state_gen = load_address_map(
        config_main, config_target, terraform_cli.get_path_terraform_state_gen
    )
    address_config = load_address_map(
        config_main, config_target, terraform_cli.get_path_terraform_config
    )

    for schema, idMap in address_config.items():
        if schema in address_state_gen:
            address_state_gen[schema].update(idMap)
        else:
            address_state_gen[schema] = idMap

    return address_state_gen


def load_address_map(config_main, config_target, path_func):
    address_path = dirs.forward_slash_join(
        path_func(config_main, config_target), "address.json"
    )

    address_map = monaco_local_entity.get_cached_data(address_path, file_expected=False)

    return address_map


def write_UI_payloads(tenant_key_main, tenant_key_target, log_dict):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_overall_diff(config_main, config_target)
    terraform_cli.delete_old_dir(path, label="overall")

    for module_key, module in log_dict["modules"].items():
        module_path = dirs.prep_dir(path, module_key)

        for resource_key, resource in module.items():
            resource_path = dirs.get_file_path(module_path, resource_key, ".txt")

            with open(resource_path, "w", encoding="utf-8") as f:
                for line in resource["module_lines"]:
                    f.write("%s\n" % line)

    other_lines_path = dirs.get_file_path(path, "other_lines", ".txt")
    with open(other_lines_path, "w", encoding="utf-8") as f:
        last_line = ""
        for line in log_dict["other_lines"]:
            if last_line == "" and line == "":
                pass
            else:
                f.write("%s\n" % line)
            last_line = line

    modules = []
    overall_stats = {}

    for module_key, module in log_dict["modules"].items():
        module_data = []
        module_stats = {}

        for resource_key, resource in module.items():
            status_code = resource["action_code"]

            resource_data = {
                "key_id": resource["resource"],
                "status": status_code,
            }

            module_stats = add_to_stats(module_stats, status_code)
            overall_stats = add_to_stats(overall_stats, status_code)

            module_data.append(resource_data)

        modules.append(
            {
                "module": module_key,
                "stats": module_stats,
                "data": module_data,
            }
        )

    statuses = [
        process_migrate_config.ACTION_DELETE,
        process_migrate_config.ACTION_ADD,
        process_migrate_config.ACTION_UPDATE,
        process_migrate_config.ACTION_IDENTICAL,
    ]

    legend = {}
    for status in statuses:
        legend[status] = process_migrate_config.ACTION_MAP[status]

    ui_payload = {
        "legend": legend,
        "modules": modules,
        "stats": overall_stats,
    }

    ui_payload_path = dirs.get_file_path(path, UI_PAYLOAD_FILENAME)
    with open(ui_payload_path, "w") as f:
        f.write(json.dumps(ui_payload))

    return ui_payload


def add_to_stats(stats, code):
    if code in stats:
        pass
    else:
        stats[code] = 0
    stats[code] += 1

    return stats


def load_ui_payload(tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_overall_diff(config_main, config_target)
    ui_payload_path = dirs.get_file_path(path, UI_PAYLOAD_FILENAME)

    cached_data = monaco_local_entity.get_cached_data(ui_payload_path, ".json")

    return cached_data


def load_plan_all_resource_diff(
    run_info, tenant_key_main, tenant_key_target, module, unique_name
):
    lines = []
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_overall_diff(config_main, config_target)
    module_path = dirs.prep_dir(path, module)
    resource_path = dirs.get_file_path(module_path, unique_name, ".txt")
    
    with open(resource_path, 'r', encoding='UTF-8') as f:
        lines = f.readlines()

    return lines
