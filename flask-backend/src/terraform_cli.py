from datetime import datetime
import os
import re
import shutil
import subprocess
import time

import credentials
import dirs
import os_helper
import process_migrate_config
import process_utils
import proxy
import sub_process_helper
import tenant
import terraform_cli_env
import terraform_cli_cmd
import terraform_history
import terraform_local
import terraform_state
import terraform_ui_util
import util_remove_ansi

DYNATRACE_PROVIDER_VERSION = "1.8.3"
PROVIDER_EXE = "terraform-provider-dynatrace_v" + DYNATRACE_PROVIDER_VERSION
if os_helper.IS_WINDOWS == False:
    PROVIDER_EXE = f"./{PROVIDER_EXE}"
CACHE_DIR_IMPORT = "cache_import"
CACHE_DIR = "cache"
PLAN_FILE = "terraform.plan"
STATE_GEN_DIR = "state_gen"
CONFIG_DIR = "config"
CLEANED_SUFFIX = "_cleaned"
PROVIDER_PLATFORM = f"{os_helper.OS}_amd64"


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
    delete_old_dir(terraform_path, avoid_dirs=[terraform_history.HISTORY_DIR])

    # Already ran with code
    write_automated_cmds = False
    if write_automated_cmds:
        set_env_filename = terraform_cli_env.write_env_cmd_base(
            tenant_data_target, terraform_path
        )

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

        terraform_cli_cmd.write_plan_cmd(terraform_path, set_env_filename)

    # Too dangerous:
    """
    terraform_cli_cmd.write_apply_cmd(terraform_path, set_env_filename)
    """

    provider_src = dirs.get_file_path(
        dirs.prep_dir(
            dirs.get_terraform_exec_dir(),
            "dynatrace.com",
            "com",
            "dynatrace",
            "1.8.3",
            PROVIDER_PLATFORM,
        ),
        PROVIDER_EXE,
        os_helper.EXEC_EXTENSION,
    )
    provider_dst = dirs.get_file_path(
        terraform_path, PROVIDER_EXE, os_helper.EXEC_EXTENSION
    )
    shutil.copy(provider_src, provider_dst)

    # print("Showing in explorer: ", export_cmd_path)
    # subprocess.Popen(r'explorer /select,"'+dirs.to_backward_slash(export_cmd_path)+r'"')
    if pre_migration:
        pass
    else:
        open_in_vscode(terraform_path)


def open_in_vscode(dir, path="."):
    vscodeExecutable = "code.cmd"
    try:
        subprocess.Popen([vscodeExecutable, path], cwd=dirs.to_backward_slash(dir))
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
    history_log_path="",
    history_log_prefix="",
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
            history_log_path,
            history_log_prefix,
        )
    else:
        env_vars = terraform_cli_env.get_env_vars_base(
            tenant_data_current,
            terraform_path,
            run_info,
            history_log_path,
            history_log_prefix,
        )

    my_env = os.environ.copy()
    my_env = {**my_env, **env_vars}

    config_proxy = {}
    credentials.set_tenant_proxy(tenant_data_current, config_proxy)
    my_env = proxy.apply_proxy_to_env_dict(my_env, config_proxy)

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

    try:
        print("NEED TO TEST THIS CHANGE ON WINDOWS!!!")
        print(terraform_path)
        if "provider" in cmd_list[0]:
            cmd_list[0] = dirs.forward_slash_join(terraform_path, cmd_list[0])

        commands = sub_process_helper.create_shell_command(cmd_list, terraform_path)

        call_result = subprocess.run(
            commands,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            shell=True,
            env=my_env,
        )

        stdout = call_result.stdout.decode()
        stderr = call_result.stderr.decode()

        print(log_label, "completed, output: ", stderr)
        if "unknown resource" in stdout:
            print(f"The command {cmd_list} failed with error {stdout}")
            process_utils.add_aggregate_error(
                run_info,
                f"The command {cmd_list} failed with error {stdout}",
            )
            run_info["return_status"] = 400

    except subprocess.CalledProcessError as error:
        print(f"The command {error.cmd} failed with error code {error.returncode}")
        process_utils.add_aggregate_error(
            run_info,
            f"The command {error.cmd} failed with error code {error.returncode}",
        )
        run_info["return_status"] = 400

    if os.path.exists(log_file_path):
        log_content = ""

        with open(log_file_path, "rb") as log_file:
            log_content = log_file.read().decode("utf-8", errors="ignore")

        wrong_platform_regex = r"for your current platform, ([^\.]+)\."
        m = re.search(wrong_platform_regex, log_content)
        if m == None:
            pass
        else:
            run_info["return_status"] = 400
            process_utils.add_aggregate_error(
                run_info,
                f"You are not using the right version of terraform.exe, you are using {m.group(1)}, but this tool is made for {PROVIDER_PLATFORM}",
            )

        if return_log_content:
            cleaned_file_name = log_file_name + CLEANED_SUFFIX + ".log"
            cleaned_log_file_path = dirs.forward_slash_join(
                terraform_path, cleaned_file_name
            )

            log_content, log_content_cleaned = util_remove_ansi.remove_ansi_colors(
                run_info,
                do_write_output=True,
                output_file_path=cleaned_log_file_path,
                log_content=log_content,
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
    is_targeted=False,
):
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)
    tenant_data_current = tenant.load_tenant(tenant_key_current)

    terraform_path = get_path_terraform(config_main, config_target)

    history_log_path = terraform_history.get_terraform_history_log_path(
        run_info, is_targeted, config_main, config_target
    )

    (terraform_path_output, export_output_dir, log_file_name) = gen_exec_path(
        run_info,
        history_log_path,
        log_filename,
        config_dir,
        is_config_creation,
        terraform_path,
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
        history_log_path,
        history_log_prefix=log_file_name,
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


def gen_exec_path(
    run_info,
    log_path,
    log_filename,
    config_dir,
    is_config_creation,
    terraform_path,
):
    log_file_path = add_timestamp_to_log_filename(log_path, log_filename)

    if is_config_creation:
        return (terraform_path, config_dir, log_file_path)

    return (
        dirs.forward_slash_join(terraform_path, config_dir),
        None,
        log_file_path,
    )


def add_timestamp_to_log_filename(log_path, log_filename):
    timestamp = datetime.now()
    formatted_timestamp = timestamp.strftime("%Y-%m-%d_%H-%M-%S")

    seasoned_log_filename = formatted_timestamp + "_" + log_filename
    log_file_path = dirs.forward_slash_join(log_path, seasoned_log_filename)
    return log_file_path


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
    plan_filename = process_utils.add_action_id_to_filename(
        run_info, "refresh" + ".plan"
    )

    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(plan_filename, is_refresh=True)
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
    plan_filename = process_utils.add_action_id_to_filename(
        run_info, "refresh" + ".plan"
    )

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=True)
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


def plan_target(run_info, tenant_key_main, tenant_key_target, terraform_params):
    plan_filename = process_utils.add_action_id_to_filename(
        run_info, "targeted" + ".plan"
    )

    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(
        plan_filename, is_refresh=False, target_info=terraform_params
    )

    return terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "plan_target",
        "Plan Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
        is_targeted=True,
    )


def apply_target(run_info, tenant_key_main, tenant_key_target, terraform_params):
    plan_filename = process_utils.add_action_id_to_filename(
        run_info, "targeted" + ".plan"
    )

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    log_dict = terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "apply_target",
        "apply Target",
        CONFIG_DIR,
        use_cache=False,
        return_log_content=True,
        is_targeted=True,
    )

    return log_dict


def apply_multi_target(run_info, tenant_key_main, tenant_key_target, terraform_params):
    plan_filename = process_utils.add_action_id_to_filename(
        run_info, "targeted" + ".plan"
    )

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    log_dict = terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "apply_multi_target",
        "apply Multi Target",
        terraform_local.MULTI_TARGET_DIR,
        use_cache=False,
        return_log_content=True,
        is_targeted=True,
    )

    terraform_state.update_state_with_multi_target_state(
        run_info, tenant_key_main, tenant_key_target
    )

    return log_dict


def plan_all(run_info, tenant_key_main, tenant_key_target):
    log_dict = run_plan_all(run_info, tenant_key_main, tenant_key_target)

    def remove_destroy(type_trimmed, name):
        if (
            type_trimmed in log_dict["modules"]
            and name in log_dict["modules"][type_trimmed]
            and "action" in log_dict["modules"][type_trimmed][name]
            and log_dict["modules"][type_trimmed][name]["action"]
            == process_migrate_config.ACTION_DELETE
        ):
            return True

        return False

    if run_info["enable_omit_destroy"] == True:
        re_run_plan = terraform_state.remove_items_from_state(
            tenant_key_main,
            tenant_key_target,
            get_path_terraform_config,
            remove_destroy,
            get_path_terraform_config,
        )
        if re_run_plan:
            log_dict = run_plan_all(run_info, tenant_key_main, tenant_key_target)

    ui_payload = terraform_local.write_UI_payloads(
        tenant_key_main, tenant_key_target, log_dict
    )

    del log_dict["modules"]

    return ui_payload, log_dict


def run_plan_all(
    run_info,
    tenant_key_main,
    tenant_key_target,
    config_dir=CONFIG_DIR,
    multi_target=False,
):
    filename = "complete"
    log_filename_prefix = "plan_all"
    log_label = "Plan All"
    if multi_target:
        filename = "targeted"
        log_filename_prefix = "plan_multi_target"
        log_label = "Plan Multi Target"

    fileType = ".plan"

    filename = process_utils.add_action_id_to_filename(run_info, filename)

    plan_filename = dirs.get_file_path(".", filename, fileType, absolute=False)
    cmd_list = terraform_cli_cmd.gen_plan_cmd_list(plan_filename, is_refresh=False)

    log_dict = terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        log_filename_prefix,
        log_label,
        config_dir,
        use_cache=False,
        return_log_content=True,
        is_targeted=multi_target,
    )

    return log_dict


def apply_all(run_info, tenant_key_main, tenant_key_target):
    plan_filename = process_utils.add_action_id_to_filename(
        run_info, "complete" + ".plan"
    )

    cmd_list = terraform_cli_cmd.gen_apply_cmd_list(plan_filename, is_refresh=False)

    return terraform_execute(
        run_info,
        tenant_key_main,
        tenant_key_target,
        tenant_key_target,
        cmd_list,
        "apply_all",
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


def delete_old_dir(path, max_retries=5, delay=2, label="Terraform", avoid_dirs=[]):
    print("Deleting old", label, "directory: ", path)
    path_to_item = ""
    try:
        for dirpath, dirnames, filenames in os.walk(path):
            for filename in filenames:
                path_to_item = dirs.forward_slash_join(dirpath, filename)
                retry_on_permission_error(os.unlink, path_to_item, max_retries, delay)

            for dirname in dirnames:
                if dirname in avoid_dirs:
                    continue

                path_to_item = dirs.forward_slash_join(dirpath, dirname)
                retry_on_permission_error(
                    shutil.rmtree, path_to_item, max_retries, delay
                )

            break

    except FileNotFoundError as e:
        dirs.print_path_too_long_message_cond(path_to_item)
        raise e
