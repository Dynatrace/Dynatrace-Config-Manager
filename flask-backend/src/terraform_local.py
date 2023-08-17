import os
import shutil

import credentials
import dirs
import json
import monaco_local_entity
import process_migrate_config
import terraform_cli
import terraform_state

OVERALL_DIFF_DIR = "overall"
UI_PAYLOAD_FILENAME = "uiPayload"
MULTI_TARGET_DIR = "multi_target"
MODULES_DIR = "modules"


def get_path_overall_diff(config_main, config_target):
    return dirs.prep_dir(
        dirs.get_tenant_work_cache_sub_dir(config_main, config_target, OVERALL_DIFF_DIR)
    )


def get_path_terraform_multi_target(config_main, config_target):
    return dirs.prep_dir(
        terraform_cli.get_path_terraform(config_main, config_target), MULTI_TARGET_DIR
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

            if resource["module_dir"] != module_key:
                resource_data["module_dir"] = resource["module_dir"]

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
    with open(ui_payload_path, "w", encoding='UTF-8') as f:
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

    with open(resource_path, "r", encoding="UTF-8") as f:
        lines = f.readlines()

    return lines


PROVIDERS_FILES = "___providers___.tf"


def plan_multi_target(
    run_info, tenant_key_main, tenant_key_target, terraform_params
):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_terraform_multi_target(config_main, config_target)
    terraform_cli.delete_old_dir(path, label="multi_target")
    path_modules = dirs.prep_dir(path, MODULES_DIR)

    path_config = terraform_cli.get_path_terraform_config(config_main, config_target)
    path_config_modules = dirs.prep_dir(path_config, MODULES_DIR)

    module_infos = {}

    for param in terraform_params:
        # module = param["module"]
        module_dir = param["module_trimmed"]
        unique_name = param["unique_name"]

        if module_dir in module_infos:
            pass
        else:
            path_module = dirs.prep_dir(path_modules, module_dir)
            path_config_module = dirs.prep_dir(path_config_modules, module_dir)
            module_infos[module_dir] = {
                "path": path_module,
                "path_config": path_config_module,
                "unique_names": [],
            }

            shutil.copy2(
                dirs.forward_slash_join(path_config_module, PROVIDERS_FILES),
                dirs.forward_slash_join(path_module, PROVIDERS_FILES),
            )

        module_infos[module_dir]["unique_names"].append(unique_name)

    module_to_remove = {}

    main_tf_lines = []

    for module_dir, module_info in module_infos.items():
        path_module = module_info["path"]
        path_config_module = module_info["path_config"]
        unique_names = module_info["unique_names"]

        main_tf_lines.append('module "' + module_dir + '" {')
        main_tf_lines.append('  source = "./modules/' + module_dir + '"')
        main_tf_lines.append("}")

        module_to_remove[module_dir] = {"unique_names": []}

        for dirpath, dirnames, filenames in os.walk(path_config_module):
            for filename in filenames:
                file_path = dirs.forward_slash_join(dirpath, filename)
                output_path = dirs.forward_slash_join(path_module, filename)

                has_variable, name = copy_resource_conditional(
                    file_path, output_path, unique_names
                )

                if has_variable:
                    module_to_remove[module_dir]["unique_names"].append(name)

    with open(dirs.forward_slash_join(path, "main.tf"), "w") as output_file:
        output_file.writelines(main_tf_lines)

    def remove_non_targetable(type_trimmed, name):
        if (
            type_trimmed in module_to_remove
            and name in module_to_remove[type_trimmed]["unique_names"]
        ):
            return True

        if (
            type_trimmed in module_infos
            and name in module_infos[type_trimmed]["unique_names"]
        ):
            return False

        return True

    terraform_state.remove_items_from_state(
        tenant_key_main,
        tenant_key_target,
        terraform_cli.get_path_terraform_config,
        remove_non_targetable,
        get_path_terraform_multi_target,
    )

    item = ".terraform/"

    shutil.copytree(
        dirs.forward_slash_join(path_config, item),
        dirs.forward_slash_join(path, item),
    )

    items_to_copy = [PROVIDERS_FILES, ".terraform.lock.hcl"]

    for item in items_to_copy:
        shutil.copy2(
            dirs.forward_slash_join(path_config, item),
            dirs.forward_slash_join(path, item),
        )

    return terraform_cli.run_plan_all(
        run_info,
        tenant_key_main,
        tenant_key_target,
        config_dir=MULTI_TARGET_DIR,
        multi_target=True,
    )


def copy_resource_conditional(file_path, output_path, strings_wanted):
    dt_variable = "${var.dynatrace_"

    has_variable = False
    do_copy = False
    name = ""
    
    if ("___variables___.tf" in file_path):
        print("Exluding ___variables___.tf file")
        return has_variable, name
        
    if ("___resources___.tf" in file_path):
        print("Exluding ___resources___.tf file")
        return has_variable, name


    try:
        with open(file_path, "r", encoding='UTF-8') as file:
            contents = file.read()
            for string in strings_wanted:
                if string in contents:
                    do_copy = True
                    name = string
                    break

            if dt_variable in contents:
                do_copy = False
                has_variable = True

    except FileNotFoundError:
        print("File not found.")

    if do_copy:
        with open(output_path, "w", encoding='UTF-8') as output_file:
            output_file.write(contents)

    return has_variable, name
