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

DYNATRACE_PROVIDER_VERSION = "1.8.3"
PROVIDER_EXE = "terraform-provider-dynatrace_v" + DYNATRACE_PROVIDER_VERSION
CACHE_DIR_IMPORT = "cache_import"
CACHE_DIR = "cache"
PLAN_FILE = "terraform.plan"
STATE_GEN_DIR = "state_gen"
CONFIG_DIR = "config"


def get_path_terraform(config):
    return dirs.prep_dir(dirs.get_tenant_data_cache_sub_dir(config, "terraform"))


def get_path_terraform_state_gen(config):
    return dirs.prep_dir(get_path_terraform(config), STATE_GEN_DIR)


def get_path_terraform_config(config):
    return dirs.prep_dir(get_path_terraform(config), CONFIG_DIR)


def create_terraform_repo(run_info, pre_migration, tenant_key_target):
    config_target = credentials.get_api_call_credentials(tenant_key_target)
    tenant_data_target = tenant.load_tenant(tenant_key_target)

    terraform_path = get_path_terraform(config_target)
    print("Terraform Path: ", terraform_path)
    delete_old_terraform_repo(terraform_path)

    set_env_filename = terraform_cli_env.write_env_cmd_base(
        tenant_data_target, terraform_path
    )
    # Already ran with code
    write_automated_cmds = True
    if write_automated_cmds:
        set_env_filename_export = terraform_cli_env.write_env_cmd_export(
            run_info,
            tenant_data_target,
            config_target,
            terraform_path,
            CONFIG_DIR,
            cache_dir=CACHE_DIR,
        )
        set_env_filename_export_import = terraform_cli_env.write_env_cmd_export(
            run_info,
            tenant_data_target,
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


def get_config_and_tenant_data(tenant_key_target):
    config_target = credentials.get_api_call_credentials(tenant_key_target)
    tenant_data_target = tenant.load_tenant(tenant_key_target)
    return config_target, tenant_data_target


def get_env_vars(
    run_info,
    tenant_data_target,
    terraform_path,
    config_target=None,
    cache_dir=None,
    terraform_path_output=None,
    use_cache=True,
):
    env_vars = None

    if use_cache:
        env_vars = terraform_cli_env.get_env_vars_export_dict(
            run_info,
            tenant_data_target,
            terraform_path,
            config_target,
            cache_dir,
            terraform_path_output,
        )
    else:
        env_vars = terraform_cli_env.get_env_vars_base(
            tenant_data_target, terraform_path
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
    log_content = ""
    log_file_path = dirs.forward_slash_join(terraform_path, log_file_name)
    print(
        log_label,
        "running, see ",
        log_file_path,
    )

    cmd_list.append(">")
    cmd_list.append(log_file_name)
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
            with open(log_file_path, "rb") as f:
                log_content = f.read().decode()
                run_info["return_status"] = 200

    return log_content


def terraform_execute(
    run_info,
    tenant_key_target,
    cmd_list,
    log_filename,
    log_label_suffix,
    config_dir,
    cache_dir=None,
    is_config_creation=False,
    use_cache=True,
    return_log_content=False,
):
    config_target, tenant_data_target = get_config_and_tenant_data(tenant_key_target)
    terraform_path = get_path_terraform(config_target)

    (terraform_path_output, export_output_dir, log_file_name) = gen_exec_path(
        log_filename, config_dir, is_config_creation, terraform_path
    )

    my_env = get_env_vars(
        run_info,
        tenant_data_target,
        terraform_path,
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
    log_filename = f"{log_filename}.log"

    if is_config_creation:
        return (terraform_path, config_dir, log_filename)

    return (
        dirs.forward_slash_join(terraform_path, config_dir),
        None,
        dirs.forward_slash_join("..", log_filename),
    )


def create_target_current_state(run_info, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_export_cmd_list(run_info, import_state=True)

    terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "import",
        "Import State",
        STATE_GEN_DIR,
        CACHE_DIR_IMPORT,
        is_config_creation=True,
    )


def terraform_refresh_plan(run_info, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(PLAN_FILE, is_refresh=True)
    terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "refresh_plan",
        "Refresh Plan [refresh state only]",
        STATE_GEN_DIR,
        CACHE_DIR_IMPORT,
    )


def terraform_refresh_apply(run_info, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(PLAN_FILE, is_refresh=True)
    terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "refresh_apply",
        "Apply Plan [refresh state only]",
        STATE_GEN_DIR,
        CACHE_DIR_IMPORT,
    )


def create_work_hcl(run_info, tenant_key_target):
    cmd_list = terraform_cli_cmd.gen_export_cmd_list(run_info, import_state=False)

    terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "export_work_hcl",
        "Export Work HCL",
        CONFIG_DIR,
        CACHE_DIR,
        is_config_creation=True,
    )


def plan_target(run_info, tenant_key_target, terraform_params, action_id):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(
        plan_filename, is_refresh=False, target_info=terraform_params
    )

    return terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "plan_target_" + "action_" + action_id,
        "Plan Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )


def apply_target(run_info, tenant_key_target, terraform_params, action_id):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    return terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "apply_target_" + "action_" + action_id,
        "apply Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )


def plan_all(run_info, tenant_key_target, action_id):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(plan_filename, is_refresh=False)

    return terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "plan_all_" + "action_" + action_id,
        "Plan Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
    )


def apply_all(run_info, tenant_key_target, action_id):
    plan_filename = "action_" + action_id + ".plan"

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    return terraform_execute(
        run_info,
        tenant_key_target,
        cmd_list,
        "apply_all_" + "action_" + action_id,
        "apply Target",
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


def delete_old_terraform_repo(path, max_retries=5, delay=2):
    print("Deleting old Terraform repo: ", path)
    try:
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                retry_on_permission_error(os.unlink, file_path, max_retries, delay)

            for dirname in dirnames:
                dir_path = os.path.join(dirpath, dirname)
                retry_on_permission_error(shutil.rmtree, dir_path, max_retries, delay)

    except FileNotFoundError as e:
        print(
            "File name probably too long, try moving the tool closer to the root of the drive."
        )
        raise e
