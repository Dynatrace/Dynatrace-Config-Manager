import os
import shutil
import subprocess
import time

import credentials
import dirs
import process_utils
import tenant
import terraform_cli_env
import terraform_cli_cmd
import terraform_local
import terraform_ui_util
import util_remove_ansi

DYNATRACE_PROVIDER_VERSION = "1.8.3"
PROVIDER_EXE = "terraform-provider-dynatrace_v" + DYNATRACE_PROVIDER_VERSION
CACHE_DIR_IMPORT = "cache_import"
CACHE_DIR = "cache"
PLAN_FILE = "terraform.plan"
STATE_GEN_DIR = "state_gen"
CONFIG_DIR = "config"


def get_path_terraform(config_main, config_target):
    return dirs.prep_dir(
        dirs.get_tenant_work_cache_sub_dir(config_main, config_target, "terraform")
    )


def get_path_terraform_state_gen(config_main, config_target):
    return dirs.prep_dir(get_path_terraform(config_main, config_target), STATE_GEN_DIR)


def get_path_terraform_config(config_main, config_target):
    return dirs.prep_dir(get_path_terraform(config_main, config_target), CONFIG_DIR)


def create_terraform_repo(run_info, pre_migration, tenant_key_main, tenant_key_target):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)
    tenant_data_main = tenant.load_tenant(tenant_key_main)
    tenant_data_target = tenant.load_tenant(tenant_key_target)

    terraform_path = get_path_terraform(config_main, config_target)
    print("Terraform Path: ", terraform_path)
    delete_old_dir(terraform_path)

    set_env_filename = terraform_cli_env.write_env_cmd_base(
        tenant_data_target, terraform_path
    )
    # Already ran with code
    write_automated_cmds = True
    if write_automated_cmds:
        set_env_filename_export = terraform_cli_env.write_env_cmd_export(
            run_info,
            tenant_data_main,
            config_main,
            config_target,
            terraform_path,
            CONFIG_DIR,
            cache_dir=CACHE_DIR,
        )
        set_env_filename_export_import = terraform_cli_env.write_env_cmd_export(
            run_info,
            tenant_data_target,
            config_main,
            config_target,
            terraform_path,
            STATE_GEN_DIR,
            cache_dir=CACHE_DIR_IMPORT,
        )
        terraform_cli_cmd.write_export_cmd(
            run_info, terraform_path, set_env_filename_export, import_state=False
        )
        terraform_cli_cmd.write_export_cmd(
            run_info, terraform_path, set_env_filename_export_import, import_state=True
        )
        terraform_cli_cmd.write_refresh_cmd(
            terraform_path, set_env_filename_export_import
        )

    # Too dangerous:
    """
    terraform_cli_cmd.write_apply_cmd(terraform_path, set_env_filename)
    """
    terraform_cli_cmd.write_plan_cmd(terraform_path, set_env_filename)

    provider_src = dirs.get_file_path(
        dirs.prep_dir(
            dirs.get_terraform_exec_dir(),
            "dynatrace.com",
            "com",
            "dynatrace",
            "1.8.3",
            "windows_amd64",
        ),
        PROVIDER_EXE,
        ".exe",
    )
    provider_dst = dirs.get_file_path(terraform_path, PROVIDER_EXE, ".exe")
    shutil.copy(provider_src, provider_dst)

    # print("Showing in explorer: ", export_cmd_path)
    # subprocess.Popen(r'explorer /select,"'+dirs.to_backward_slash(export_cmd_path)+r'"')
    if pre_migration:
        pass
    else:
        vscodeExecutable = "code.cmd"
        try:
            subprocess.Popen(
                [vscodeExecutable, "."], cwd=dirs.to_backward_slash(terraform_path)
            )
        except FileNotFoundError as e:
            print("Can't open VSCode as", vscodeExecutable, "isn't found.")


def get_env_vars(
    run_info,
    tenant_data_current,
    terraform_path,
    config_main=None,
    config_target=None,
    cache_dir=None,
    terraform_path_output=None,
    use_cache=True,
):
    env_vars = None

    if use_cache:
        env_vars = terraform_cli_env.get_env_vars_export_dict(
            run_info,
            tenant_data_current,
            terraform_path,
            config_main,
            config_target,
            cache_dir,
            terraform_path_output,
        )
    else:
        env_vars = terraform_cli_env.get_env_vars_base(
            tenant_data_current, terraform_path
        )

    my_env = os.environ.copy()
    my_env = {**my_env, **env_vars}
    return my_env


def execute_terraform_cmd(
    run_info,
    my_env,
    cmd_list,
    terraform_path,
    log_file_name,
    log_label,
    return_log_content=False,
):
    execution_log_file_name = log_file_name + ".log"

    log_dict = {}
    log_file_path = dirs.forward_slash_join(terraform_path, execution_log_file_name)
    print(
        log_label,
        "running, see ",
        log_file_path,
    )

    cmd_list.append(">")
    cmd_list.append(execution_log_file_name)
    cmd_list.append("2>&1")

    print(terraform_path)
    try:
        call_result = subprocess.run(
            cmd_list,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            shell=True,
            env=my_env,
            cwd=terraform_path,
        )

        stdout = call_result.stdout.decode()
        stderr = call_result.stderr.decode()

        print(log_label, "completed, output: ", stdout, stderr)

    except subprocess.CalledProcessError as error:
        print(f"The command {error.cmd} failed with error code {error.returncode}")
        process_utils.add_aggregate_error(
            run_info,
            f"The command {error.cmd} failed with error code {error.returncode}",
        )
        run_info["return_status"] = 400

    if return_log_content:
        if os.path.exists(log_file_path):
            cleaned_file_name = log_file_name + "_cleaned" + ".log"
            cleaned_log_file_path = dirs.forward_slash_join(
                terraform_path, cleaned_file_name
            )

            log_content, log_content_cleaned = util_remove_ansi.remove_ansi_colors(
                run_info,
                log_file_path,
                True,
                cleaned_log_file_path,
            )

            log_dict = terraform_ui_util.create_dict_from_terraform_log(
                log_content, log_content_cleaned
            )

    return log_dict


def terraform_execute(
    run_info,
    tenant_key_main,
    tenant_key_target,
    tenant_key_current,
    cmd_list,
    log_filename,
    log_label_suffix,
    config_dir,
    cache_dir=None,
    is_config_creation=False,
    use_cache=True,
    return_log_content=False,
):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)
    tenant_data_current = tenant.load_tenant(tenant_key_current)

    terraform_path = get_path_terraform(config_main, config_target)

    (terraform_path_output, export_output_dir, log_file_name) = gen_exec_path(
        log_filename, config_dir, is_config_creation, terraform_path
    )

    my_env = get_env_vars(
        run_info,
        tenant_data_current,
        terraform_path,
        config_main,
        config_target,
        cache_dir,
        export_output_dir,
        use_cache,
    )

    log_label = f"Terraform {log_label_suffix}"

    return execute_terraform_cmd(
        run_info,
        my_env,
        cmd_list,
        terraform_path_output,
        log_file_name,
        log_label,
        return_log_content,
    )


def gen_exec_path(log_filename, config_dir, is_config_creation, terraform_path):
    if is_config_creation:
        return (terraform_path, config_dir, log_filename)

    return (
        dirs.forward_slash_join(terraform_path, config_dir),
        None,
        dirs.forward_slash_join("..", log_filename),
    )


def create_target_current_state(run_info, tenant_key_main, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_export_cmd_list(run_info, import_state=True)

    terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "import",
        "Import State",
        STATE_GEN_DIR,
        CACHE_DIR_IMPORT,
        is_config_creation=True,
    )


def terraform_refresh_plan(run_info, tenant_key_main, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(PLAN_FILE, is_refresh=True)
    terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "refresh_plan",
        "Refresh Plan [refresh state only]",
        STATE_GEN_DIR,
        CACHE_DIR_IMPORT,
    )


def terraform_refresh_apply(run_info, tenant_key_main, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(PLAN_FILE, is_refresh=True)
    terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "refresh_apply",
        "Apply Plan [refresh state only]",
        STATE_GEN_DIR,
        CACHE_DIR_IMPORT,
    )


def create_work_hcl(run_info, tenant_key_main, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_export_cmd_list(run_info, import_state=False)

    terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_main,
        cmd_list,
        "export_work_hcl",
        "Export Work HCL",
        CONFIG_DIR,
        CACHE_DIR,
        is_config_creation=True,
    )


def plan_target(
    run_info, tenant_key_main, tenant_key_target, terraform_params, action_id
):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(
        plan_filename, is_refresh=False, target_info=terraform_params
    )

    return terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "plan_target_" + "action_" + action_id,
        "Plan Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )


def apply_target(
    run_info, tenant_key_main, tenant_key_target, terraform_params, action_id
):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    return terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "apply_target_" + "action_" + action_id,
        "apply Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )


def plan_all(run_info, tenant_key_main, tenant_key_target, action_id):
    log_dict = run_plan_all(run_info, tenant_key_main, tenant_key_target, action_id)

    if run_info["enable_omit_destroy"] == True:
        re_run_plan = terraform_local.remove_destroy_from_state(
            tenant_key_main, tenant_key_target, log_dict
        )
        if re_run_plan:
            log_dict = run_plan_all(
                run_info, tenant_key_main, tenant_key_target, action_id
            )

    ui_payload = terraform_local.write_UI_payloads(
        tenant_key_main, tenant_key_target, log_dict
    )

    del log_dict["modules"]

    return ui_payload, log_dict


def run_plan_all(run_info, tenant_key_main, tenant_key_target, action_id):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(plan_filename, is_refresh=False)

    log_dict = terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "plan_all_" + "action_" + action_id,
        "Plan All",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )

    return log_dict


def apply_all(run_info, tenant_key_main, tenant_key_target, action_id):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    return terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "apply_all_" + "action_" + action_id,
        "apply All",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )


def retry_on_permission_error(action, path, max_retries=5, delay=2):
    for _ in range(max_retries):
        try:
            action(path)
            return
        except PermissionError:
            print(f"Permission denied for: {path}. Retrying in {delay} seconds.")
            time.sleep(delay)
    raise PermissionError(
        f"Unable to perform action on: {path} after {max_retries} retries."
    )


def delete_old_dir(path, max_retries=5, delay=2, label="Terraform"):
    print("Deleting old", label, "directory: ", path)
    try:
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                file_path = dirs.forward_slash_join(dirpath, filename)
                retry_on_permission_error(os.unlink, file_path, max_retries, delay)

            for dirname in dirnames:
                dir_path = dirs.forward_slash_join(dirpath, dirname)
                retry_on_permission_error(shutil.rmtree, dir_path, max_retries, delay)

    except FileNotFoundError as e:
        print(
            "File name probably too long, try moving the tool closer to the root of the drive."
        )
        raise e
