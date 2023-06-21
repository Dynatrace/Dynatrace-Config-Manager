import dirs
import monaco_cli_match
import terraform_cli
import windows_cmd_file_util

TERRAFORM_FALSE = "false"
TERRAFORM_TRUE = "true"


def write_env_cmd_base(tenant_data_current, terraform_path):
    env_vars = get_env_vars_base(tenant_data_current, terraform_path)

    command_file_name = "setenv"

    write_env_vars_to_cmd(terraform_path, env_vars, command_file_name)

    return command_file_name


def get_env_vars_base(tenant_data_target, terraform_path):
    env_vars = {
        "DYNATRACE_ENV_URL": tenant_data_target["url"],
        "DYNATRACE_API_TOKEN": tenant_data_target["APIKey"],
        "DYNATRACE_LOG_HTTP": "terraform-provider-dynatrace.http.log",
        "DT_CACHE_FOLDER": dirs.prep_dir(terraform_path, ".cache"),
        "DYNATRACE_PROVIDER_SOURCE": "dynatrace.com/com/dynatrace",
        "DYNATRACE_PROVIDER_VERSION": terraform_cli.DYNATRACE_PROVIDER_VERSION,
        "DYNATRACE_HEREDOC": "false",
        "DYNATRACE_CUSTOM_PROVIDER_LOCATION": dirs.get_terraform_exec_dir(),
        #"TF_LOG": "TRACE" # DO NOT COMMIT!!!
    }

    return env_vars


def get_env_vars_export_dict(
    run_info,
    tenant_data_current,
    terraform_path,
    config_main,
    config_target,
    cache_dir,
    terraform_path_output,
):
    env_vars_export_extras = get_env_vars_export_extras(
        run_info, config_main, config_target, cache_dir, terraform_path_output
    )
    env_vars_base = get_env_vars_base(tenant_data_current, terraform_path)

    env_vars = {**env_vars_base, **env_vars_export_extras}

    return env_vars


def get_env_vars_export_extras(
    run_info, config_main, config_target, cache_dir, terraform_path_output
):
    cache_strict = TERRAFORM_FALSE
    if run_info["forced_schema_id"] != None and len(run_info["forced_schema_id"]) > 0:
        cache_strict = TERRAFORM_TRUE
        
    enable_dashboards = TERRAFORM_FALSE
    if run_info["enable_dashboards"] != None and run_info["enable_dashboards"] is True:
        enable_dashboards = TERRAFORM_TRUE

    env_vars = {
        "CACHE_OFFLINE_MODE": "true",
        "DYNATRACE_MIGRATION_CACHE_FOLDER": dirs.forward_slash_join(
            monaco_cli_match.get_path_match_configs_results(config_main, config_target),
            cache_dir,
        ),
        "DYNATRACE_MIGRATION_CACHE_STRICT": cache_strict,
        "DYNATRACE_HCL_NO_FORMAT": "true",
        "DYNATRACE_BUILD_ADDRESS_FILES": "true",
        "DYNATRACE_ATOMIC_DEPENDENCIES": "true",
        "DYNATRACE_ENABLE_EXPORT_DASHBOARD": enable_dashboards,
        "DYNATRACE_IN_MEMORY_TAR_FOLDERS": "true",
    }
    if terraform_path_output is not None:
        env_vars["DYNATRACE_TARGET_FOLDER"] = terraform_path_output

    return env_vars


def write_env_cmd_export(
    run_info,
    tenant_data_current,
    config_main,
    config_target,
    terraform_path,
    terraform_path_output,
    cache_dir="cache",
):
    env_vars = get_env_vars_export_dict(
        run_info,
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
