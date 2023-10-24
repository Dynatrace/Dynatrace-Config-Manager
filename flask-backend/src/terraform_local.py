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
import re

import credentials
import dirs
import json
import monaco_local_entity
import process_migrate_config
import terraform_cli
import terraform_state

OVERALL_DIFF_DIR = "overall"
OVERALL_DIFF_DIR_TEMP = "ovral_hist_tmp"
UI_PAYLOAD_FILENAME = "uiPayload"
MULTI_TARGET_DIR = "multi_target"
MODULES_DIR = "modules"


def get_path_overall_diff(config_main, config_target, temp=False):
    overall_dir = OVERALL_DIFF_DIR

    if temp:
        overall_dir = OVERALL_DIFF_DIR_TEMP

    path = dirs.prep_dir(
        dirs.get_tenant_work_cache_sub_dir(config_main, config_target, overall_dir)
    )

    return path


def get_path_terraform_multi_target(config_main, config_target):
    return dirs.prep_dir(
        terraform_cli.get_path_terraform(config_main, config_target), MULTI_TARGET_DIR
    )


def write_UI_payloads_plan_all(tenant_key_main, tenant_key_target, log_dict):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_overall_diff(config_main, config_target)
    terraform_cli.delete_old_dir(path, label="overall")

    write_per_resource_output(log_dict, path)

    write_other_lines(log_dict, path)

    ui_payload = build_ui_payload(log_dict)

    write_ui_payload(path, ui_payload)

    return ui_payload


def write_UI_payloads_apply(tenant_key_main, tenant_key_target, log_dict):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_overall_diff(config_main, config_target)

    write_per_resource_output(log_dict, path)

    write_other_lines(log_dict, path, append=True)

    ui_payload_apply = build_ui_payload(log_dict)

    ui_payload_current = load_ui_payload(tenant_key_main, tenant_key_target)

    ui_payload = update_ui_payload(ui_payload_apply, ui_payload_current)

    write_ui_payload(path, ui_payload)

    return ui_payload


def update_ui_payload(apply, current):
    overall_stats = current["stats"]

    if current is None or apply is None:
        return current

    if "modules" in current and "modules" in apply:
        pass
    else:
        return current

    for module_apply in apply["modules"]:
        module_current, mod_idx = get_module_current(module_apply, current)
        if module_current is None:
            continue

        module_stats = module_current["stats"]

        for resource_apply in module_apply["data"]:
            resource_current, res_idx = get_resource_current(resource_apply, module_current)
            if resource_current is None:
                continue

            module_stats = add_to_stats(module_stats, resource_current["status"], -1)
            overall_stats = add_to_stats(overall_stats, resource_current["status"], -1)

            module_stats = add_to_stats(module_stats, resource_apply["status"])
            overall_stats = add_to_stats(overall_stats, resource_apply["status"])

            current["modules"][mod_idx]["data"][res_idx]["status"] = resource_apply[
                "status"
            ]

        current["modules"][mod_idx]["stats"] = module_stats

    current["stats"] = overall_stats

    return current


def get_module_current(module_apply, current):
    idx = 0
    while idx < len(current["modules"]):
        module_current = current["modules"][idx]
        if module_current["module"] == module_apply["module"]:
            return module_current, idx

        idx += 1

    print(
        f"WARNING: Could not find module {module_apply['module']} in current ui_payload"
    )
    return None, -1


def get_resource_current(resource_apply, module_current):
    idx = 0
    while idx < len(module_current["data"]):
        resource_current = module_current["data"][idx]
        if resource_current["key_id"] == resource_apply["key_id"]:
            return resource_current, idx
        idx += 1

    print(
        f"WARNING: Could not find resource {resource_apply['key_id']} in current ui_payload"
    )
    return None, -1


def compile_modules_and_stats(log_dict):
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

    return modules, overall_stats


def write_ui_payload(path, ui_payload):
    ui_payload_path = dirs.get_file_path(path, UI_PAYLOAD_FILENAME)
    with open(ui_payload_path, "w", encoding="UTF-8") as f:
        f.write(json.dumps(ui_payload))


def build_ui_payload(log_dict):
    modules, overall_stats = compile_modules_and_stats(log_dict)

    legend = get_legend()

    ui_payload = {
        "legend": legend,
        "modules": modules,
        "stats": overall_stats,
    }

    return ui_payload


def get_legend():
    statuses = [
        process_migrate_config.ACTION_DELETE,
        process_migrate_config.ACTION_ADD,
        process_migrate_config.ACTION_UPDATE,
        process_migrate_config.ACTION_IDENTICAL,
    ]

    legend = {}
    for status in statuses:
        legend[status] = process_migrate_config.ACTION_MAP[status]
    return legend


def write_other_lines(log_dict, path, append=True):
    file_mode = "w"
    if append:
        file_mode = "a"

    other_lines_path = dirs.get_file_path(path, "other_lines", ".txt")
    with open(other_lines_path, file_mode, encoding="utf-8") as f:
        last_line = ""
        for line in log_dict["other_lines"]:
            if last_line == "" and line == "":
                pass
            else:
                f.write("%s\n" % line)
            last_line = line


def write_per_resource_output(log_dict, path):
    for module_key, module in log_dict["modules"].items():
        module_path = dirs.prep_dir(path, module_key)

        for resource_key, resource in module.items():
            resource_path = dirs.get_file_path(module_path, resource_key, ".txt")

            with open(resource_path, "w", encoding="utf-8") as f:
                for line in resource["module_lines"]:
                    f.write("%s\n" % line)


def add_to_stats(stats, code, incr_val=1):
    if code in stats:
        pass
    else:
        stats[code] = 0
    stats[code] += incr_val

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
DATASOURCES_FILES = "___datasources___.tf"


def plan_multi_target(run_info, tenant_key_main, tenant_key_target, terraform_params):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path = get_path_terraform_multi_target(config_main, config_target)
    terraform_cli.delete_old_dir(path, label="multi_target")
    path_config = terraform_cli.get_path_terraform_config(config_main, config_target)

    module_infos = {}

    for param in terraform_params:
        # module = param["module"]
        module_dir = param["module_trimmed"]
        unique_name = param["unique_name"]

        if module_dir in module_infos:
            pass
        else:
            module_infos[module_dir] = []

        module_infos[module_dir].append(unique_name)

    variable_done = {}
    variable_list = []
    var_defs = {}
    main_tf = {}
    resources_tf_dict = {}
    resources_done = {}

    for module_dir, resource_list in module_infos.items():
        (
            variable_done,
            variable_list,
            var_defs,
            main_tf,
            resources_tf_dict,
            resources_done,
        ) = multi_target_plan(
            variable_done,
            variable_list,
            var_defs,
            main_tf,
            resources_tf_dict,
            resources_done,
            module_dir,
            resource_list,
            path,
            path_config,
        )

    path_modules = dirs.forward_slash_join(path, MODULES_DIR)
    path_config_modules = dirs.forward_slash_join(path_config, MODULES_DIR)

    copy_other_files(main_tf, path_modules, path_config_modules, PROVIDERS_FILES)

    # There shouldn't be datasources files as we use variables
    # If there are at some point, then they should be handled properly
    # Datasources create entries in the state files that also should be handled

    # copy_other_files(main_tf, path_modules, path_config_modules, DATASOURCES_FILES)
    write_resources_tf_files(resources_tf_dict, path_modules)
    write_variables_tf_files(var_defs, path_modules)
    write_main_tf_file(main_tf, path)
    create_sub_state(tenant_key_main, tenant_key_target, resources_done)
    copy_remaining_files(path, path_config)

    return terraform_cli.run_plan_all(
        run_info,
        tenant_key_main,
        tenant_key_target,
        config_dir=MULTI_TARGET_DIR,
        multi_target=True,
    )


def copy_other_files(main_tf, path_modules, path_config_modules, file_name):
    for module_dir in main_tf.keys():
        module_path = dirs.prep_dir(path_modules, module_dir)
        module_config_path = dirs.prep_dir(path_config_modules, module_dir)

        try:
            shutil.copy2(
                dirs.forward_slash_join(module_config_path, file_name),
                dirs.forward_slash_join(module_path, file_name),
            )
        except FileNotFoundError:
            pass


def write_resources_tf_files(resources_tf_dict, path_modules):
    for module_dir, resources_dict in resources_tf_dict.items():
        if len(resources_dict.keys()) >= 1:
            resources_tf_path_module = dirs.forward_slash_join(
                path_modules, module_dir, "___resources___.tf"
            )

            with open(resources_tf_path_module, "w", encoding="UTF-8") as output_file:
                for resource_name, resource_lines in resources_dict.items():
                    output_file.writelines(resource_lines)


def write_variables_tf_files(var_defs, path_modules):
    for module_dir, variables_dict in var_defs.items():
        if len(variables_dict.keys()) >= 1:
            variables_tf_path_module = dirs.forward_slash_join(
                path_modules, module_dir, "___variables___.tf"
            )

            with open(variables_tf_path_module, "w", encoding="UTF-8") as output_file:
                for variable_name, variable_lines in variables_dict.items():
                    output_file.writelines(variable_lines)


def write_main_tf_file(main_tf, path):
    main_tf_path = dirs.forward_slash_join(path, "main.tf")

    with open(main_tf_path, "w", encoding="UTF-8") as output_file:
        for module_name, module_lines in main_tf.items():
            output_file.writelines(module_lines)


def create_sub_state(tenant_key_main, tenant_key_target, resources_done):
    def remove_non_targeted(module_dir, resource_name):
        if module_dir in resources_done and resource_name in resources_done[module_dir]:
            return False

        return True

    terraform_state.remove_items_from_state(
        tenant_key_main,
        tenant_key_target,
        terraform_cli.get_path_terraform_config,
        remove_non_targeted,
        get_path_terraform_multi_target,
    )


def copy_remaining_files(path, path_config):
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


def multi_target_plan(
    variable_done,
    variable_list,
    var_defs,
    main_tf,
    resources_tf_dict,
    resources_done,
    module_dir,
    resource_list,
    path,
    path_config,
):
    path_modules = dirs.forward_slash_join(path, MODULES_DIR)
    path_config_modules = dirs.forward_slash_join(path_config, MODULES_DIR)

    module_path = dirs.prep_dir(path_modules, module_dir)
    module_config_path = dirs.prep_dir(path_config_modules, module_dir)
    main_tf_path = dirs.forward_slash_join(path_config, "main.tf")

    non_resource_file = [
        "___datasources___.tf",
        "___providers___.tf",
        "___resources___.tf",
        "___variables___.tf",
    ]

    for dirpath, dirnames, filenames in os.walk(module_config_path):
        for filename in filenames:
            if filename in non_resource_file:
                continue

            file_path = dirs.forward_slash_join(dirpath, filename)
            resource_found, contents = file_contains_resource(file_path, resource_list)
            if resource_found:
                output_path = dirs.forward_slash_join(module_path, filename)
                write_resource(output_path, contents)
                variable_list, variable_done = get_all_variables(
                    contents, variable_list, variable_done
                )

    if module_dir in resources_done:
        pass
    else:
        resources_done[module_dir] = {}

    for resource in resource_list:
        resources_done[module_dir][resource] = True

    variables_path = dirs.forward_slash_join(module_config_path, "___variables___.tf")

    var_defs[module_dir] = get_variables_definition(variables_path, variable_list)
    main_tf[module_dir], resources_dict = get_main_tf_definition(
        main_tf_path, variable_list, module_dir=module_dir
    )

    for sub_module in resources_dict.keys():
        resources_tf_path = dirs.forward_slash_join(
            path_config_modules, sub_module, "___resources___.tf"
        )
        resources_tf_dict, resources_done = get_resources_tf(
            resources_tf_path,
            resources_dict[sub_module].keys(),
            sub_module,
            resources_tf_dict,
            resources_done,
        )

    for variable in variable_list:
        variable_done[variable] = True

    resources_to_extract = {}
    for sub_module in resources_tf_dict.keys():
        resources = []
        for resource in resources_tf_dict[sub_module].keys():
            if resources_done[sub_module][resource] == True:
                pass
            else:
                resources.append(resource)
                resources_done[sub_module][resource] = True

        if len(resources) >= 1:
            resources_to_extract[sub_module] = resources

    for sub_module, resources in resources_to_extract.items():
        (
            variable_done,
            variable_list,
            var_defs,
            main_tf,
            resources_tf_dict,
            resources_done,
        ) = multi_target_plan(
            variable_done,
            variable_list,
            var_defs,
            main_tf,
            resources_tf_dict,
            resources_done,
            sub_module,
            resources,
            path,
            path_config,
        )

    return (
        variable_done,
        variable_list,
        var_defs,
        main_tf,
        resources_tf_dict,
        resources_done,
    )


# This code expects variables that start with ${var.dynatrace_
def get_all_variables(contents, variable_list, variable_done):
    variable_regex = r"(\${var.(dynatrace_[^.]+)[^}]+})"

    match_list = re.findall(variable_regex, contents)

    if len(match_list) >= 1:
        for match in match_list:
            (_, variable) = match
            if variable in variable_done:
                pass
            else:
                variable_done[variable] = False
                variable_list.append(variable)

    return variable_list, variable_done


# This code will not support manually written variables unless they start with "variable"
def get_variables_definition(file_path, variable_list):
    var_defs = {}

    variable_list_seasoned = []
    for variable in variable_list:
        variable_list_seasoned.append((variable, '"' + variable + '"'))

    try:
        with open(file_path, "r", encoding="UTF-8") as file:
            lines = file.readlines()

            current_var = ""
            current_var_details = []
            var_done = True
            depth = -1

            for line in lines:
                if var_done:
                    if line.startswith("variable"):
                        for variable_info in variable_list_seasoned:
                            (variable, variable_seasoned) = variable_info
                            if variable_seasoned in line:
                                current_var = variable
                                current_var_details.append(line)
                                var_done = False
                                depth = 0
                                depth = ajust_depth(line, depth)
                                break
                    continue

                current_var_details.append(line)
                depth = ajust_depth(line, depth)
                if depth == 0:
                    var_done = True
                    var_defs[current_var] = current_var_details
                    current_var = ""
                    current_var_details = []

    except FileNotFoundError:
        print("File not found.")

    return var_defs


def get_main_tf_definition(file_path, variable_list, module_dir):
    main_tf = {}
    resource_dict = {}

    variable_list_seasoned = []
    for variable in variable_list:
        variable_list_seasoned.append((variable, variable + " = module."))

    try:
        with open(file_path, "r", encoding="UTF-8") as file:
            lines = file.readlines()

            current_module = ""
            current_module_details = []
            module_done = True

            for line in lines:
                if module_done:
                    if line.startswith('module "'):
                        current_module_details.append(line)
                        current_module = extract_module_name(line)
                        module_done = False
                        continue
                    elif line.startswith("}"):
                        current_module_details.append(line)

                        if current_module == module_dir:
                            main_tf = current_module_details

                        current_module = ""
                        current_module_details = []

                else:
                    current_module_details.append(line)
                    if " source = " in line:
                        module_done = True
                    continue

                if current_module == module_dir:
                    for variable_info in variable_list_seasoned:
                        (variable, variable_seasoned) = variable_info
                        if variable_seasoned in line:
                            current_module_details.append(line)
                            # print(variable_seasoned, line)
                            (
                                variable_resource_module,
                                variable_resource_name,
                            ) = extract_variable_source(line)
                            if variable_resource_module in resource_dict:
                                pass
                            else:
                                resource_dict[variable_resource_module] = {}
                            resource_dict[variable_resource_module][
                                variable_resource_name
                            ] = variable

    except FileNotFoundError:
        print("File not found.")

    return main_tf, resource_dict


# This code will not support manually written resources unless they start with "output"
def get_resources_tf(
    file_path,
    resources_list,
    module,
    resources_tf_dict,
    resources_done,
):
    resources_list_seasoned = []
    for resource in resources_list:
        resources_list_seasoned.append((resource, '"' + resource + '"'))

    try:
        with open(file_path, "r", encoding="UTF-8") as file:
            lines = file.readlines()

            current_res = ""
            current_res_details = []
            res_done = True
            depth = -1
            value_line = r"value = dynatrace_" + module
            value_regex = value_line + r"\.([^\n]+)"

            for line in lines:
                if res_done:
                    if line.startswith("output"):
                        for resource_info in resources_list_seasoned:
                            (resource, resource_seasoned) = resource_info
                            if resource_seasoned in line:
                                current_res = resource
                                current_res_details.append(line)
                                res_done = False
                                depth = 0
                                depth = ajust_depth(line, depth)
                                break
                    continue

                current_res_details.append(line)
                if value_line in line:
                    current_res = extract_resource(value_regex, line)
                depth = ajust_depth(line, depth)

                if depth == 0:
                    if module in resources_done:
                        pass
                    else:
                        resources_done[module] = {}

                    if module in resources_tf_dict:
                        pass
                    else:
                        resources_tf_dict[module] = {}

                    if current_res in resources_done[module]:
                        pass
                    else:
                        resources_done[module][current_res] = False
                        resources_tf_dict[module][current_res] = current_res_details

                    res_done = True
                    current_res = ""
                    current_res_details = []

    except FileNotFoundError:
        print("File not found.")

    return resources_tf_dict, resources_done


def extract_module_name(line):
    regex = r'module \"([^"]+)\" {'

    m = re.search(regex, line)

    if m is None:
        return ""
    else:
        return m.group(1)


def extract_variable_source(line):
    regex = r" = module\.([^\.]+)\.([^\n\r]+)"

    m = re.search(regex, line)
    if m is None:
        return ""
    else:
        return m.group(1), m.group(2)


def ajust_depth(line, depth):
    depth += line.count("{")
    depth -= line.count("}")

    return depth


def extract_resource(regex, line):
    m = re.search(regex, line)
    if m is None:
        return ""
    else:
        return m.group(1)


def file_contains_resource(file_path, resource_list):
    do_copy = False
    contents = ""

    try:
        with open(file_path, "r", encoding="UTF-8") as file:
            contents = file.read()

            for string in resource_list:
                if f'" "{string}" {{' in contents:
                    do_copy = True
                    break

    except FileNotFoundError:
        print("File not found.")

    if do_copy:
        return do_copy, contents

    return do_copy, ""


def write_resource(path, contents):
    with open(path, "w", encoding="UTF-8") as output_file:
        output_file.write(contents)
