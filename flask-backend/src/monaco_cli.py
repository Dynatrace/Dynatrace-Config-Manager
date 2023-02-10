import credentials
import dirs
import json
import os
import shutil
import subprocess
import tenant

token_name = "MONACO_TENANT_TOKEN"
project_name = "p"


def get_path_entities(config):
    return dirs.get_tenant_data_cache_sub_dir(config, "ent_mon")


def get_path_finished_file_entities(config):
    return dirs.get_file_path(get_path_entities(config), 'finished')


def get_path_finished_file(path):
    return dirs.get_file_path(path, 'finished.json')


def extract_entities(run_info, tenant_key):

    result = {}
    call_result = {}
    command = "monaco-windows-amd64.exe download entities"

    config = credentials.get_api_call_credentials(tenant_key)

    path_entities = get_path_entities(config)

    delete_old_cache(config, path_entities)

    tenant_data = tenant.load_tenant(tenant_key)
    my_env = gen_monaco_env(config, tenant_data)

    command = "monaco-windows-amd64.exe"
    options = ["download", "entities", "direct", tenant_data['url'],
               token_name, '-o', path_entities, '-f', '-p', project_name]

    try:
        monaco_exec_dir = dirs.get_monaco_exec_dir()
        print("Download entities using Monaco, see ",
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

    if ("Finished download" in stderr):
        print("Entities downloaded successfully")
        result['monaco_finished'] = True
        save_finished_entities(config)
    else:
        run_info['aggregate_error'] = f"The command {command}{options} did not fail, but did not finish"
        if (stdout != ""):
            result['stdout'] = stdout
        if (stderr != ""):
            result['stderr'] = stderr
        print("ERROR Running Monaco Extraction: ", result)

    return result


def delete_old_cache(config, path_entities):
    is_previous_finished = is_finished_entities(config)

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


def gen_monaco_env(config, tenant_data):
    my_env = os.environ.copy()
    my_env[token_name] = tenant_data['APIKey']
    my_env['CONCURRENT_REQUESTS'] = str(config['monaco_concurrent_requests'])
    my_env['MONACO_FEAT_ENTITIES'] = "1"
    return my_env


def save_finished_entities(config):
    finished_file = {
        'monaco_finished': True
    }

    with open(get_path_finished_file_entities(config), 'w') as f:
        f.write(json.dumps(finished_file))


def load_finished_entities(config):
    finished_file = {}

    path = get_path_finished_file_entities(config)

    if (os.path.exists(path) and os.path.isfile(path)):
        with open(path, 'r') as f:
            finished_file = json.load(f)

    return finished_file


def is_finished_entities(config):
    finished_file = load_finished_entities(config)
    if ('monaco_finished' in finished_file):
        return finished_file['monaco_finished']

    return False
