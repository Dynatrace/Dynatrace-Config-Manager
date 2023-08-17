import re

import process_migrate_config

# Regular expression pattern to match ANSI escape codes
tf_module_pattern = re.compile(r"[^m]*module\.([^ .]*)\.([^ .]*)\.([^ .:]*)[\s:]*")


def create_dict_from_terraform_log(terraform_log, terraform_log_cleaned):
    log_dict = {}
    modules_dict = {}
    last_other_line = ""
    other_lines = []
    lines_cleaned = terraform_log_cleaned.split("\n")
    lines = terraform_log.split("\n")
    module_lines = []
    first_line_cleaned = ""
    processing_module = False
    done_processing = False

    for idx, line_cleaned in enumerate(lines_cleaned):
        line_unused = True

        if processing_module:
            pass

        elif line_cleaned.startswith("  # module."):
            module_lines = []
            first_line_cleaned = line_cleaned
            processing_module = True

        elif ": Refreshing state..." in line_cleaned:
            module_lines = [lines[idx]]
            first_line_cleaned = line_cleaned
            line_unused = False
            done_processing = True

        if processing_module:
            line_unused = False
            module_lines.append(lines[idx])

            if line_cleaned.startswith("    }"):
                done_processing = True
                processing_module = False

        if done_processing:
            done_processing = False
            extract_tf_module(module_lines, modules_dict, first_line_cleaned)
            module_lines = []
            first_line_cleaned = ""

        if "Apply complete!" in line_cleaned:
            line_unused = False
            log_dict["apply_complete"] = True
        elif "No changes." in line_cleaned:
            line_unused = False
            log_dict["no_changes"] = True
        elif "Saved the plan to:" in line_cleaned:
            line_unused = False
            log_dict["is_plan_done"] = True

        if line_unused:
            other_line = lines[idx]
            if last_other_line == "" and other_line == "":
                pass
            else:
                other_lines.append(lines[idx])
            last_other_line = other_line

    log_dict["modules"] = modules_dict
    log_dict["other_lines"] = other_lines

    return log_dict


def extract_tf_module(module_lines, modules_dict, first_line_cleaned):
    action = None
    if first_line_cleaned.endswith("will be created"):
        action = process_migrate_config.ACTION_ADD
    elif first_line_cleaned.endswith("will be updated in-place"):
        action = process_migrate_config.ACTION_UPDATE
    elif first_line_cleaned.endswith("will be destroyed"):
        action = process_migrate_config.ACTION_DELETE
    elif first_line_cleaned.endswith("has changed"):
        action = process_migrate_config.ACTION_REFRESH
    elif ": Refreshing state..." in first_line_cleaned:
        action = process_migrate_config.ACTION_IDENTICAL

    match = tf_module_pattern.search(first_line_cleaned)

    if match:
        pass
    else:
        print(
            "ERROR: Could not find terraform module details for: ", first_line_cleaned
        )
        return

    module_dir = match.group(1)
    module_name = match.group(2)
    resource = match.group(3)

    module_name_trimmed = trim_module_name(module_name)

    if module_name_trimmed in modules_dict:
        pass
    else:
        modules_dict[module_name_trimmed] = {}

    if resource in modules_dict[module_name_trimmed]:
        if (
            modules_dict[module_name_trimmed][resource]["action"]
            == process_migrate_config.ACTION_IDENTICAL
        ):
            module_lines = (
                modules_dict[module_name_trimmed][resource]["module_lines"]
                + [""]
                + module_lines
            )
        else:
            print(
                "ERROR: Duplicate resource", module_name, module_name_trimmed, resource
            )

    action_code = None
    if action is not None:
        action_code = process_migrate_config.ACTION_MAP[action]

    modules_dict[module_name_trimmed][resource] = {
        "module_name_trimmed": module_name_trimmed,
        "module_dir": module_dir,
        "resource": resource,
        "action": action,
        "action_code": action_code,
        "module_lines": module_lines,
    }


def trim_module_name(module_name):
    module_name_trimmed = module_name
    prefix = "dynatrace_"

    if module_name.startswith(prefix):
        module_name_trimmed = module_name[len(prefix) :]

    return module_name_trimmed
