import shutil
import subprocess

from showinfm import show_in_file_manager

import credentials
import dirs
import monaco_cli_match
import tenant

DYNATRACE_PROVIDER_VERSION = '1.8.3'
CACHE_STRICT_YES = 'true'
CACHE_STRICT_NO = 'false'
PROVIDER_EXE = 'terraform-provider-dynatrace_v' + DYNATRACE_PROVIDER_VERSION


def get_path_terraform(config):
    return dirs.prep_dir(
        dirs.get_tenant_data_cache_sub_dir(config, "terraform"))


def create_terraform_repo(run_info, pre_migration, tenant_key_target, tenant_key_main=None):

    config_target = credentials.get_api_call_credentials(tenant_key_target)
    tenant_data_target = tenant.load_tenant(tenant_key_target)

    terraform_path = get_path_terraform(config_target)
    print("Terraform Path: ", terraform_path)
    delete_old_terraform_repo(terraform_path)

    command_file_name = write_env_cmd(run_info, tenant_data_target, config_target, terraform_path, isExport=True)
    export_cmd_path = write_export_cmd(run_info, terraform_path, command_file_name)
    command_file_name = write_env_cmd(run_info, tenant_data_target, config_target, terraform_path, isExport=False)
    write_apply_cmd(terraform_path, command_file_name)

    provider_src = dirs.get_file_path(dirs.get_terraform_exec_dir(), PROVIDER_EXE, '.exe')
    provider_dst = dirs.get_file_path(terraform_path, PROVIDER_EXE, '.exe')
    shutil.copy(provider_src, provider_dst)

    # print("Showing in explorer: ", export_cmd_path)
    # subprocess.Popen(r'explorer /select,"'+dirs.to_backward_slash(export_cmd_path)+r'"')
    if (pre_migration):
        pass
    else:
        subprocess.Popen(['code.cmd', '.'],
                         cwd=dirs.to_backward_slash(terraform_path))


def delete_old_terraform_repo(path):

    print("Deleting old Terraform repo: ", path)
    try:
        shutil.rmtree(path)
    except FileNotFoundError as e:
        print(
            "File name probably too long, try moving the tool closer to the root of the drive.")
        raise e


def write_env_cmd(run_info, tenant_data_target, config_target, terraform_path, isExport):

    cache_strict = CACHE_STRICT_NO
    if (run_info['forced_schema_id'] != None and len(run_info['forced_schema_id']) > 0):
        cache_strict = CACHE_STRICT_YES

    lines = [
        "@ECHO OFF",
        "SET DYNATRACE_ENV_URL="+tenant_data_target['url'],
        "SET DYNATRACE_API_TOKEN="+tenant_data_target['APIKey'],
        "SET DYNATRACE_LOG_HTTP=terraform-provider-dynatrace.http.log",
        "",
        "SET DT_CACHE_FOLDER="+dirs.prep_dir(terraform_path, ".cache"),
        "",
        "SET DYNATRACE_PROVIDER_SOURCE=dynatrace.com/com/dynatrace",
        "SET DYNATRACE_PROVIDER_VERSION="+DYNATRACE_PROVIDER_VERSION,
    ]
    
    command_file_name = 'setenv'
    
    if (isExport):
        export_lines = [
            "",
            "SET CACHE_OFFLINE_MODE=true",
            "SET DYNATRACE_MIGRATION_CACHE_FOLDER="+dirs.forward_slash_join(
                monaco_cli_match.get_path_match_configs_results(config_target), 'cache'),
            "SET DYNATRACE_MIGRATION_CACHE_STRICT="+cache_strict,
        ]
        
        lines = lines + export_lines
        
        command_file_name = command_file_name + '_export'
        
    write_lines_to_file(dirs.get_file_path(
        terraform_path, command_file_name, '.cmd'),
        lines
    )
    
    return command_file_name


def write_export_cmd(run_info, terraform_path, command_file_name):

    specific_schema_id = ""

    if (run_info['forced_schema_id'] != None and len(run_info['forced_schema_id']) > 0):

        print("TODO: Specify the schema name properly in terraform export")
        print("TODO: Use the terraform export code to handle it")
        if ('builtin:management-zones' in run_info['forced_schema_id']):
            specific_schema_id = ' dynatrace_management_zone_v2'

    lines = [
        "@ECHO OFF",
        "",
        "CALL " + command_file_name + ".cmd",
        "",
        "terraform-provider-dynatrace_v1.8.3.exe -export"+specific_schema_id,
    ]

    export_cmd_path = dirs.get_file_path(
        terraform_path, 'export', '.cmd')

    write_lines_to_file(export_cmd_path, lines)

    return export_cmd_path


def write_apply_cmd(terraform_path, command_file_name):

    lines = [
        "@ECHO OFF",
        "",
        "CALL " + command_file_name + ".cmd",
        "",
        "cd configuration"
        "",
        "IF EXIST terraform.plan DEL terraform.plan",
        "terraform plan -lock=false -refresh=false -out=terraform.plan >NUL",
        "terraform apply -lock=false -parallelism=10 -auto-approve terraform.plan",
        "IF EXIST terraform.plan DEL terraform.plan",
        "",
    ]

    write_lines_to_file(dirs.get_file_path(
        terraform_path, 'apply', '.cmd'),
        lines
    )


def write_lines_to_file(path, lines):
    lines = add_line_changes(lines)

    with open(path, 'w') as f:

        f.writelines(lines)


def add_line_changes(lines):
    lines_modified = []

    for line in lines:
        lines_modified.append(line+'\n')

    return lines_modified
