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
import monaco_cli_match
import terraform_cli
import terraform_state
import windows_cmd_file_util

TERRAFORM_FALSE = "false"
TERRAFORM_TRUE = "true"


def write_env_cmd_base(tenant_data_current, terraform_path):
    env_vars = get_env_vars_base(tenant_data_current, terraform_path)

    command_file_name = "setenv"

    write_env_vars_to_cmd(terraform_path, env_vars, command_file_name)

    return command_file_name


def get_env_vars_base(
    tenant_data_current,
    terraform_path,
    history_log_path="",
    history_log_prefix="",
):
    log_file_path = "terraform-provider-dynatrace.http.log"
    log_prefix = "terraform-provider-dynatrace"
    if history_log_prefix == "":
        pass
    else:
        log_file_path = history_log_prefix + ".http.log"
        log_prefix = history_log_prefix

    if history_log_path == "":
        pass
    else:
        log_file_path = dirs.forward_slash_join(history_log_path, log_file_path)

    env_vars = {
        "DYNATRACE_ENV_URL": tenant_data_current["url"],
        "DYNATRACE_API_TOKEN": tenant_data_current["APIKey"],
        "DYNATRACE_LOG_HTTP": log_file_path,
        "DT_CACHE_FOLDER": dirs.prep_dir(terraform_path, ".cache"),
        "DYNATRACE_PROVIDER_SOURCE": "dynatrace.com/com/dynatrace",
        "DYNATRACE_PROVIDER_VERSION": terraform_cli.DYNATRACE_PROVIDER_VERSION,
        "DYNATRACE_HEREDOC": "false",
        "DYNATRACE_NO_REFRESH_ON_IMPORT": "true",
        "DYNATRACE_CUSTOM_PROVIDER_LOCATION": dirs.get_terraform_exec_dir(),
        "DYNATRACE_IGNORE_CHANGES_REQUIRES_ATTENTION": "true",
        "DYNATRACE_DEBUG": "true",
        "DYNATRACE_LOG_DEBUG_PREFIX": log_prefix,
        # "TF_LOG": "TRACE" # DO NOT COMMIT!!!
    }

    return env_vars


def get_env_vars_export_dict(
    run_info,
    tenant_key_current,
    tenant_data_current,
    terraform_path,
    config_main,
    config_target,
    cache_dir,
    terraform_path_output,
    history_log_path="",
    history_log_prefix="",
):
    env_vars_extras_export = get_env_vars_extras_export(
        run_info,
        config_main,
        config_target,
        terraform_path_output,
        tenant_key_current,
    )
    env_vars_extras_cache = get_env_vars_extras_cache(
        run_info,
        config_main,
        config_target,
        cache_dir,
    )
    env_vars_base = get_env_vars_base(
        tenant_data_current,
        terraform_path,
        history_log_path,
        history_log_prefix,
    )

    env_vars = {**env_vars_base, **env_vars_extras_export, **env_vars_extras_cache}

    return env_vars


def get_env_vars_cache_dict(
    run_info,
    tenant_data_current,
    terraform_path,
    config_main,
    config_target,
    cache_dir,
    history_log_path="",
    history_log_prefix="",
):
    env_vars_extras_cache = get_env_vars_extras_cache(
        run_info,
        config_main,
        config_target,
        cache_dir,
    )

    env_vars_base = get_env_vars_base(
        tenant_data_current,
        terraform_path,
        history_log_path,
        history_log_prefix,
    )

    env_vars = {**env_vars_base, **env_vars_extras_cache}

    return env_vars


def get_env_vars_extras_export(
    run_info,
    config_main,
    config_target,
    terraform_path_output,
    tenant_key_current,
):
    tenant_key_linked = ""
    is_source_export = False
    if config_main["tenant_key"] == tenant_key_current:
        tenant_key_linked = config_target["tenant_key"]
        is_source_export = True
    else:
        tenant_key_linked = config_main["tenant_key"]

    enable_dashboards = TERRAFORM_FALSE
    if run_info["enable_dashboards"] != None and run_info["enable_dashboards"] is True:
        enable_dashboards = TERRAFORM_TRUE

    enable_ultra_parallel = TERRAFORM_FALSE
    if (
        run_info["enable_ultra_parallel"] != None
        and run_info["enable_ultra_parallel"] is True
    ):
        enable_ultra_parallel = TERRAFORM_TRUE

    env_vars = {
        "DYNATRACE_QUICK_INIT": TERRAFORM_TRUE,
        "DYNATRACE_HCL_NO_FORMAT": TERRAFORM_TRUE,
        "DYNATRACE_ATOMIC_DEPENDENCIES": TERRAFORM_TRUE,
        "DYNATRACE_ENABLE_EXPORT_DASHBOARD": enable_dashboards,
        "DYNATRACE_ULTRA_PARALLEL": enable_ultra_parallel,
        "DYNATRACE_PREV_STATE_ON": TERRAFORM_TRUE,
        "DYNATRACE_PREV_STATE_PATH_THIS": terraform_state.get_keyed_state_file_path(
            config_main, config_target, tenant_key_current
        ),
        "DYNATRACE_PREV_STATE_PATH_LINKED": terraform_state.get_keyed_state_file_path(
            config_main, config_target, tenant_key_linked
        ),
    }
    if terraform_path_output is not None:
        env_vars["DYNATRACE_TARGET_FOLDER"] = terraform_path_output

    if is_source_export:
        env_vars["DYNATRACE_IMPORT_STATE_PATH"] = dirs.forward_slash_join(
            terraform_cli.get_path_terraform_state_gen(config_main, config_target),
            terraform_state.STATE_FILENAME,
        )

    return env_vars


def get_env_vars_extras_cache(
    run_info,
    config_main,
    config_target,
    cache_dir,
):
    cache_strict = TERRAFORM_FALSE
    if run_info["forced_schema_id"] != None and len(run_info["forced_schema_id"]) > 0:
        cache_strict = TERRAFORM_TRUE

    env_vars = {
        "CACHE_OFFLINE_MODE": TERRAFORM_TRUE,
        "DYNATRACE_MIGRATION_CACHE_FOLDER": dirs.forward_slash_join(
            monaco_cli_match.get_path_match_configs_results(config_main, config_target),
            cache_dir,
        ),
        "DYNATRACE_MIGRATION_CACHE_STRICT": cache_strict,
        "DYNATRACE_IN_MEMORY_TAR_FOLDERS": TERRAFORM_TRUE,
    }

    return env_vars


def write_env_cmd_export(
    run_info,
    tenant_key_current,
    tenant_data_current,
    config_main,
    config_target,
    terraform_path,
    terraform_path_output,
    cache_dir="cache",
):
    env_vars = get_env_vars_export_dict(
        run_info,
        tenant_key_current,
        tenant_data_current,
        terraform_path,
        config_main,
        config_target,
        cache_dir,
        terraform_path_output,
    )

    command_file_name = "setenv_export" + "_" + cache_dir

    write_env_vars_to_cmd(terraform_path, env_vars, command_file_name)

    return command_file_name


def write_env_vars_to_cmd(terraform_path, env_vars, command_file_name):
    lines = env_vars_to_cmd(env_vars)

    windows_cmd_file_util.write_lines_to_file(
        dirs.get_file_path(terraform_path, command_file_name, ".cmd"), lines
    )


def env_vars_to_cmd(env_vars):
    lines = [
        "@ECHO OFF",
    ]

    for key, value in env_vars.items():
        lines.append("SET " + key + "=" + value)
    return lines
