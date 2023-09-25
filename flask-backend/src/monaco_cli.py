import json
import os

import dirs
import process_utils
import proxy
import os_helper

TOKEN_NAME = "MONACO_TENANT_TOKEN"
PROJECT_NAME = "p"
MONACO_EXEC = f"monaco-{os_helper.OS}-amd64{os_helper.EXEC_EXTENSION}"


def get_path_finished_file(type_path):
    return dirs.get_file_path(type_path, "finished")


def gen_monaco_env(config, tenant_data, log_path=None):
    my_env = os.environ.copy()
    my_env[TOKEN_NAME] = tenant_data["APIKey"]
    my_env["CONCURRENT_REQUESTS"] = str(config["monaco_concurrent_requests"])
    my_env["MONACO_FEAT_ENTITIES"] = "1"
    proxy.apply_proxy_to_env_dict(my_env, config)

    if log_path is None:
        pass
    else:
        my_env["MONACO_LOG_PATH"] = log_path

    return my_env


def handle_subprocess_error(
    run_info, result, command, options, stdout, stderr, log_label
):
    process_utils.add_aggregate_error(
        run_info, f"The command {command}{options} did not fail, but did not finish"
    )
    run_info["return_status"] = 400
    if stdout != "":
        result["stdout"] = stdout
    if stderr != "":
        result["stderr"] = stderr
    print("ERROR Running Monaco ", log_label, ": ", result)


def save_finished(path, finished_file=None):
    if finished_file == None:
        finished_file = {"monaco_finished": True}

    with open(get_path_finished_file(path), "w", encoding="UTF-8") as f:
        f.write(json.dumps(finished_file))


def load_finished(path):
    finished_file = {}

    path = get_path_finished_file(path)

    if os.path.exists(path) and os.path.isfile(path):
        with open(path, "r", encoding="UTF-8") as f:
            finished_file = json.load(f)

    return finished_file


def is_finished(path):
    finished_file = load_finished(path)
    if "monaco_finished" in finished_file:
        return finished_file["monaco_finished"], finished_file

    return False, finished_file
