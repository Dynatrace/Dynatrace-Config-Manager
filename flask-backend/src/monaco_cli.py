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

import json
import os

import credentials
import dirs
import process_utils
import proxy
import os_helper
import terraform_cli

TOKEN_NAME = "MONACO_TENANT_TOKEN"
PROJECT_NAME = "p"
MONACO_EXEC = (
    f"one-topology-{os_helper.OS}-{os_helper.ARCHITECTURE}{os_helper.EXEC_EXTENSION}"
)


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


CACHE_VERSION_V_0_19 = "v0.19"
CACHE_VERSION_V_0_19_2 = "v0.19.2"
CACHE_VERSION_V_1_2 = "v1.2"
CACHE_VERSION_V_1_4_6 = "v1.4.6"
CACHE_VERSION_LATEST = CACHE_VERSION_V_1_4_6
VALID_CACHE_VERSION = [
    CACHE_VERSION_V_0_19,
    CACHE_VERSION_V_0_19_2,
    CACHE_VERSION_V_1_2,
    CACHE_VERSION_V_1_4_6,
    CACHE_VERSION_LATEST,
]


def handle_subprocess_error(
    run_info, result, command, options, stdout, stderr, log_label
):
    process_utils.add_aggregate_error(
        run_info, f"The command {command}{options} did not fail, but did not finish"
    )
    run_info["return_status"] = 400
    if stdout != "":
        result["stdout"] = stdout
        run_info["stdout"] = stdout
    if stderr != "":
        result["stderr"] = stderr
        run_info["stderr"] = stderr
    print("ERROR Running OneTopology ", log_label, ": ", result)


def save_finished(path, finished_file, action_type, label):
    finished_file["monaco_finished"] = True
    finished_file["finished_at"] = terraform_cli.get_formatted_timestamp()
    finished_file["cache_version"] = CACHE_VERSION_LATEST
    finished_file["action_type"] = action_type
    finished_file["label"] = label

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
        if (
            "cache_version" in finished_file
            and finished_file["cache_version"] in VALID_CACHE_VERSION
        ):
            return finished_file["monaco_finished"], finished_file, True
        else:
            print("ERROR: THIS CACHE IS OUT OF DATE, NEED TO RE-RUN EXTRACTION")
            return False, finished_file, True

    return False, finished_file, False
