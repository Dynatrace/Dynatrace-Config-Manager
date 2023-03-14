import credentials
import dirs
import monaco_cli
import monaco_cli_download
import monaco_local_entity
import tenant
import yaml
import subprocess


def get_path_match_entities(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "mat_ent_mon")


def get_path_match_entities_results(config):
    return dirs.prep_dir(
        get_path_match_entities(config), "results")


def get_path_match_entities_yaml(config):
    return dirs.get_file_path(get_path_match_entities(config), 'match', '.yaml')


def match_entities(run_info, tenant_key_target, tenant_key_main=None):
    result = {}
    call_result = {}

    if (tenant_key_main == None):
        tenant_key_main = tenant_key_target

    config_target = credentials.get_api_call_credentials(tenant_key_target)
    config_main = credentials.get_api_call_credentials(tenant_key_main)

    match_yaml_path = save_match_yaml(config_target, config_main)

    command = monaco_cli.MONACO_EXEC
    options = ["match", match_yaml_path]

    tenant_data = tenant.load_tenant(tenant_key_target)
    my_env = monaco_cli.gen_monaco_env(config_target, tenant_data)

    try:
        monaco_exec_dir = dirs.get_monaco_exec_dir()
        print("Match entities using Monaco, see ",
              dirs.forward_slash_join(monaco_exec_dir, ".logs"))
        call_result = subprocess.run(
            [command] + options, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, shell=True, env=my_env, cwd=monaco_exec_dir)
    except subprocess.CalledProcessError as error:
        print(
            f"The command {error.cmd} failed with error code {error.returncode}")
        run_info['aggregate_error'] = f"The command {error.cmd} failed with error code {error.returncode}"
        run_info['return_status'] = 400
        return result

    stdout = call_result.stdout.decode()
    stderr = call_result.stderr.decode()

    if ("Finished matching" in stderr):
        print("Match completed successfully")
        result['monaco_finished'] = True

        finished_file = {
            'monaco_finished': True,
            'tenant_key_main': tenant_key_main,
            'tenant_key_target': tenant_key_target,
        }
        monaco_cli.save_finished(
            get_path_match_entities(config_target), finished_file)
    else:
        monaco_cli.handle_subprocess_error(
            run_info, result, command, options, stdout, stderr, "Match Entities")

    return result


def save_match_yaml(config_target, config_main):

    match_config = {
        'name': 'match',
        'type': 'entities',
        'outputPath': get_path_match_entities_results(config_target),
        'sourceInfo': {
            'manifestPath': dirs.get_file_path(monaco_cli_download.get_path_entities(config_main), 'manifest', '.yaml'),
            'project': monaco_cli.PROJECT_NAME,
            'environment': monaco_cli.PROJECT_NAME,
        },
        'targetInfo': {
            'manifestPath': dirs.get_file_path(monaco_cli_download.get_path_entities(config_target), 'manifest', '.yaml'),
            'project': monaco_cli.PROJECT_NAME,
            'environment': monaco_cli.PROJECT_NAME,
        },
    }

    match_yaml_path = get_path_match_entities_yaml(config_target)

    with open(match_yaml_path, 'w') as f:
        f.write(yaml.dump(match_config))

    return match_yaml_path


def is_finished_match_entities(tenant_key_target, tenant_key_main=None):
    if (tenant_key_main == None):
        tenant_key_main = tenant_key_target

    config_target = credentials.get_api_call_credentials(tenant_key_target)

    is_finished, finished_file = monaco_cli.is_finished(
        get_path_match_entities(config_target))

    print(is_finished, finished_file, tenant_key_main, tenant_key_target)

    return (
        is_finished
        and 'tenant_key_target' in finished_file and finished_file['tenant_key_target'] == tenant_key_target
        and 'tenant_key_main' in finished_file and finished_file['tenant_key_main'] == tenant_key_main
    )


def try_monaco_match(run_info, tenant_key_main, tenant_key_target):
    matched_entities_dict = {}
    entities_dict = {}
    run_legacy_match = True

    if (run_info['preemptive_config_copy'] == False
        and monaco_cli_download.is_finished_entities(tenant_key=tenant_key_main)
            and monaco_cli_download.is_finished_entities(tenant_key=tenant_key_target)):
        must_rerun = False

        if is_finished_match_entities(tenant_key_target, tenant_key_main):
            print("Attempt to load Monaco Matching cache")
            must_rerun, matched_entities_dict, entities_dict = monaco_local_entity.load_matched_entities(
                tenant_key_target, tenant_key_main)

            if (must_rerun == False):
                print("Loaded Monaco cache successfully")
                run_legacy_match = False
            else:
                print("Loaded Monaco cache was out of date")
        else:
            print("No Monaco cache available")
            must_rerun = True

        if (must_rerun == True):
            print("Run Monaco Matching")
            run_info_local = {'aggregate_error': [], 'return_status': 200}
            match_entities(run_info_local, tenant_key_target, tenant_key_main)
            print("Monaco Match Output: ", run_info_local)

            if (is_finished_match_entities(tenant_key_target, tenant_key_main)):
                must_rerun, matched_entities_dict, entities_dict = monaco_local_entity.load_matched_entities(
                    tenant_key_target, tenant_key_main)

                if (must_rerun == False):
                    print("Ran Monaco Matching successfully")
                    run_legacy_match = False
                else:
                    print("Attempt to run Monaco Match failed, will run legacy Match")
            else:
                print("Attempt to run Monaco Match failed, will run legacy Match")

    return run_legacy_match, matched_entities_dict, entities_dict
