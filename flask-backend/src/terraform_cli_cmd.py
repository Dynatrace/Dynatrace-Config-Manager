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

import dirs
import terraform_cli
import windows_cmd_file_util


def gen_export_cmd_list(run_info, import_state):
    specific_schema_id = ""

    if run_info["forced_schema_id"] != None and len(run_info["forced_schema_id"]) > 0:
        print("TODO: Specify the schema name properly in terraform export")
        print("TODO: Use the terraform export code to handle it")
        if "builtin:management-zones" in run_info["forced_schema_id"]:
            specific_schema_id = "dynatrace_management_zone_v2"

    export_cmd_list = [terraform_cli.PROVIDER_EXE]
    export_cmd_list.append("-export")
    export_cmd_list.append("-id")

    if import_state:
        export_cmd_list.append("-import-state-v2")
    else:
        export_cmd_list.append("-migrate")

    if specific_schema_id != "":
        export_cmd_list.append(specific_schema_id)

    return export_cmd_list


def write_export_cmd(run_info, terraform_path, set_env_filename, import_state=False):
    export_cmd_list = gen_export_cmd_list(run_info, import_state)
    export_cmd_line = " ".join(export_cmd_list)

    lines = [
        "@ECHO OFF",
        "",
        "CALL " + set_env_filename + ".cmd",
        "",
        export_cmd_line,
    ]

    cmd_name = "export"
    if import_state:
        cmd_name = "import-state"

    export_cmd_path = dirs.get_file_path(terraform_path, cmd_name, ".cmd")

    windows_cmd_file_util.write_lines_to_file(export_cmd_path, lines)

    return export_cmd_path


def write_apply_cmd(terraform_path, set_env_filename):
    plan_file = terraform_cli.PLAN_FILE

    cmd_list_plan = gen_plan_cmd_list(plan_file, is_refresh=False)
    cmd_line_plan = " ".join(cmd_list_plan)

    cmd_list_apply = gen_apply_cmd_list(plan_file, is_refresh=False)
    cmd_line_apply = " ".join(cmd_list_apply)

    lines = [
        "@ECHO OFF",
        "",
        "CALL " + set_env_filename + ".cmd",
        "",
        "cd " + terraform_cli.CONFIG_DIR,
        "IF EXIST " + plan_file + " DEL " + plan_file,
        cmd_line_plan,
        cmd_line_apply,
        "IF EXIST " + plan_file + " DEL " + plan_file,
        "",
        "cd ..",
        "",
    ]

    windows_cmd_file_util.write_lines_to_file(
        dirs.get_file_path(terraform_path, "apply", ".cmd"), lines
    )


def write_plan_cmd(terraform_path, set_env_filename):
    plan_file = terraform_cli.PLAN_FILE

    cmd_list_plan = gen_plan_cmd_list(plan_file, is_refresh=False, save_state=False)
    cmd_line_plan = " ".join(cmd_list_plan)

    lines = [
        "@ECHO OFF",
        "",
        "CALL " + set_env_filename + ".cmd",
        "",
        "cd " + terraform_cli.CONFIG_DIR,
        cmd_line_plan,
        "",
        "cd ..",
        "",
    ]

    windows_cmd_file_util.write_lines_to_file(
        dirs.get_file_path(terraform_path, "plan", ".cmd"), lines
    )


def generate_cmd_list(command, extra_args, isRefresh=False, save_state=True):
    cmd_list = [
        "terraform",
        command,
        "-lock=false",
        "-parallelism=50",
    ]

    # if save_state:
    #   cmd_list.append("-no-color")

    if isRefresh:
        cmd_list.append("-refresh-only")

    cmd_list.extend(extra_args)

    return cmd_list


def gen_plan_cmd_list(plan_file, is_refresh=False, save_state=True, target_info=None):
    extra_args = []

    if target_info is not None:
        for target in target_info:
            target_arg = (
                "-target=module."
                + target["module_trimmed"]
                + "."
                + target["module"]
                + "."
                + target["unique_name"]
            )
            extra_args.append(target_arg)

    if save_state:
        extra_args.extend(["-out=" + plan_file, ">NUL"])

    return generate_cmd_list("plan", extra_args, is_refresh, save_state)


def gen_apply_cmd_list(plan_file, is_refresh=False):
    extra_args = ["-auto-approve", plan_file]
    return generate_cmd_list("apply", extra_args, is_refresh)


def write_refresh_cmd(terraform_path, set_env_filename):
    plan_file = terraform_cli.PLAN_FILE

    cmd_list_plan = gen_plan_cmd_list(plan_file, is_refresh=True)
    cmd_line_plan = " ".join(cmd_list_plan)

    cmd_list_apply = gen_apply_cmd_list(plan_file, is_refresh=True)
    cmd_line_apply = " ".join(cmd_list_apply)

    lines = [
        "@ECHO OFF",
        "",
        "CALL " + set_env_filename + ".cmd",
        "",
        "cd " + terraform_cli.STATE_GEN_DIR,
        "IF EXIST " + plan_file + " DEL " + plan_file,
        cmd_line_plan,
        cmd_line_apply,
        "IF EXIST " + plan_file + " DEL " + plan_file,
        "",
        "cd ..",
        "",
    ]

    windows_cmd_file_util.write_lines_to_file(
        dirs.get_file_path(terraform_path, "refresh", ".cmd"), lines
    )
