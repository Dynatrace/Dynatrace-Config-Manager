import credentials
import dirs
import os
import monaco_cli
import process_utils
import shutil
import subprocess
import tenant


def get_path_entities(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "ent_mon")


def extract_entities(run_info, tenant_key):

    result = {}
    call_result = {}
    command = monaco_cli.MONACO_EXEC + " download entities"

    config = credentials.get_api_call_credentials(tenant_key)

    path_entities = get_path_entities(config)

    delete_old_cache(config, path_entities)

    tenant_data = tenant.load_tenant(tenant_key)
    my_env = monaco_cli.gen_monaco_env(config, tenant_data)

    command = monaco_cli.MONACO_EXEC
    options = ["download", "entities", "direct", tenant_data['url'],
               monaco_cli.TOKEN_NAME, '-o', path_entities, '-f', '-p', monaco_cli.PROJECT_NAME]

    try:
        monaco_exec_dir = dirs.get_monaco_exec_dir()
        print("Download entities using Monaco, see ",
              dirs.forward_slash_join(monaco_exec_dir, ".logs"))
        call_result = subprocess.run(
            [command] + options, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True, shell=True, env=my_env, cwd=monaco_exec_dir)
    except subprocess.CalledProcessError as error:
        print(
            f"The command {error.cmd} failed with error code {error.returncode}")
        process_utils.add_aggregate_error(
            run_info, f"The command {error.cmd} failed with error code {error.returncode}")
        run_info['return_status'] = 400
        return result

    stdout = call_result.stdout.decode()
    stderr = call_result.stderr.decode()

    if ("Finished download" in stderr):
        print("Entities downloaded successfully")
        result['monaco_finished'] = True
        monaco_cli.save_finished(path_entities)
    else:
        monaco_cli.handle_subprocess_error(
            run_info, result, command, options, stdout, stderr, "Extract Entities")

    return result


def delete_old_cache(config, path_entities):
    is_previous_finished = is_finished_entities(config=config)

    if (is_previous_finished):

        print("Deleting old Monaco cache: ", path_entities)
        try:
            shutil.rmtree(path_entities)
        except FileNotFoundError as e:
            print(
                "File name probably too long, try moving the tool closer to the root of the drive.")
            raise e
    else:

        non_monaco_cache_path = dirs.get_tenant_data_cache_sub_dir(
            config, "entities_list")

        if (os.path.exists(non_monaco_cache_path) and os.path.isdir(non_monaco_cache_path)):
            print("Deleting pre-Monaco cache: ", non_monaco_cache_path)
            shutil.rmtree(non_monaco_cache_path)


def is_finished_entities(config=None, tenant_key=None):
    if (config == None):
        config = credentials.get_api_call_credentials(tenant_key)

    is_finished, _ = monaco_cli.is_finished(get_path_entities(config))

    return is_finished
