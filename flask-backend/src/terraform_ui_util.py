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

import re

import process_migrate_config

# Regular expression pattern to match ANSI escape codes
tf_module_pattern = re.compile(
    r"[^m]*module\.([^ .]*)(\.data)?\.([^ .]*)\.([^ .:,]*)[\s:,]*"
)

REFRESH_STATE_LABEL = ": Refreshing state..."
CREATING_LABEL = ": Creating..."
CREATION_COMPLETE = ": Creation complete after"
MODIFYING_LABEL = ": Modifying..."
MODIFICATIONS_COMPLETE = "Modifications complete after"
DESTROYING_LABEL = ": Destroying..."
DESTRUCTION_COMPLETE = ": Destruction complete after"

PLAN_MODULE_SECTION_START = "  # module."
PLAN_MODULE_SECTION_END = "    }"

ERROR_SECTION_CHAR_START = "╷"
ERROR_SECTION_CHAR_END = "╵"


def create_dict_from_terraform_log(terraform_log, terraform_log_cleaned):
    log_dict = {}
    modules_dict = {}
    last_other_line = ""
    other_lines = []
    lines_cleaned = terraform_log_cleaned.split("\n")
    lines = terraform_log.split("\n")
    module_lines = []
    module_line_cleaned = ""
    processing_module = False
    done_processing = False
    module_line_tag = ""
    is_error = False

    done_tag = ""

    for idx, line_cleaned in enumerate(lines_cleaned):
        line_unused = True

        if processing_module:
            pass

        elif line_cleaned.startswith(PLAN_MODULE_SECTION_START):
            module_lines = []
            module_line_cleaned = line_cleaned
            processing_module = True
            done_tag = PLAN_MODULE_SECTION_END
        elif line_cleaned.startswith(ERROR_SECTION_CHAR_START):
            module_lines = []
            module_line_cleaned = ""
            module_line_tag = "│   with module."
            processing_module = True
            done_tag = ERROR_SECTION_CHAR_END
            is_error = True

        elif (
            REFRESH_STATE_LABEL in line_cleaned
            or CREATING_LABEL in line_cleaned
            or CREATION_COMPLETE in line_cleaned
            or MODIFYING_LABEL in line_cleaned
            or MODIFICATIONS_COMPLETE in line_cleaned
            or DESTROYING_LABEL in line_cleaned
            or DESTRUCTION_COMPLETE in line_cleaned
        ):
            module_lines = []
            module_line_cleaned = line_cleaned
            processing_module = True
            done_processing = True

        if processing_module:
            line_unused = False
            module_lines.append(lines[idx])

            if module_line_cleaned == "" and line_cleaned.startswith(module_line_tag):
                module_line_cleaned = line_cleaned

            if done_tag != "" and line_cleaned.startswith(done_tag):
                done_processing = True
                done_tag = ""

            if done_processing:
                module_line_tag = ""
                done_tag = ""
                processing_module = False
                done_processing = False
                extract_tf_module(
                    module_lines, modules_dict, module_line_cleaned, is_error
                )
                module_lines = []
                module_line_cleaned = ""
                is_error = False

        if "Apply complete!" in line_cleaned:
            log_dict["apply_complete"] = True
        elif "No changes." in line_cleaned:
            log_dict["no_changes"] = True
        elif "Saved the plan to:" in line_cleaned:
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


def extract_tf_module(module_lines, modules_dict, first_line_cleaned, is_error):
    action = None
    if is_error:
        action = process_migrate_config.ACTION_ERROR
    elif first_line_cleaned.endswith("will be created"):
        action = process_migrate_config.ACTION_ADD
    elif first_line_cleaned.endswith("will be updated in-place"):
        action = process_migrate_config.ACTION_UPDATE
    elif first_line_cleaned.endswith("will be destroyed"):
        action = process_migrate_config.ACTION_DELETE
    elif first_line_cleaned.endswith("has changed"):
        action = process_migrate_config.ACTION_REFRESH
    elif REFRESH_STATE_LABEL in first_line_cleaned:
        action = process_migrate_config.ACTION_IDENTICAL
    elif CREATING_LABEL in first_line_cleaned:
        action = None
    elif CREATION_COMPLETE in first_line_cleaned:
        action = process_migrate_config.ACTION_DONE
    elif MODIFYING_LABEL in first_line_cleaned:
        action = None
    elif MODIFICATIONS_COMPLETE in first_line_cleaned:
        action = process_migrate_config.ACTION_DONE
    elif DESTROYING_LABEL in first_line_cleaned:
        action = None
    elif DESTRUCTION_COMPLETE in first_line_cleaned:
        action = process_migrate_config.ACTION_DONE

    match = tf_module_pattern.search(first_line_cleaned)

    if match:
        pass
    else:
        print(
            "ERROR: Could not find terraform module details for: ", first_line_cleaned
        )
        return

    module_dir = match.group(1)
    module_name = match.group(3)
    resource = match.group(4)

    module_name_trimmed = trim_module_name(module_name)

    if module_name_trimmed in modules_dict:
        pass
    else:
        modules_dict[module_name_trimmed] = {}

    immobile_status = [
        None,
        process_migrate_config.ACTION_IDENTICAL,
    ]
    action_code = None

    if resource in modules_dict[module_name_trimmed]:
        if modules_dict[module_name_trimmed][resource]["action"] in immobile_status:
            pass
        else:
            print(
                f"INFO: {module_name}, {module_name_trimmed}, {resource} has both actions: {action} (new) and {modules_dict[module_name_trimmed][resource]['action_code']}"
            )

        action_code = modules_dict[module_name_trimmed][resource]["action_code"]
        module_lines = (
            modules_dict[module_name_trimmed][resource]["module_lines"]
            + [""]
            + module_lines
        )

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
