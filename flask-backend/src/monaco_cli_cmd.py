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

import os

import dirs
import monaco_cli
import monaco_cli_download
import os_helper


def run_one_topology_validation_checks():
    if(os_helper.IS_DARWIN):
        pass
    else:
        return {}
    
    run_info = {}
    run_blank(run_info)
    is_one_topology_runnable = True
    if "return_status" in run_info and run_info["return_status"] >= 300:
        is_one_topology_runnable = False

    return {
        "is_darwin": os_helper.IS_DARWIN,
        "is_one_topology_runnable": is_one_topology_runnable,
        "absolute_one_topology_exec_path_local": dirs.forward_slash_join(
            os.path.abspath(dirs.get_monaco_exec_dir()), monaco_cli.MONACO_EXEC
        ),
    }


# On MacOS, it is important to accept the executable before it's copied
def run_blank(run_info):
    my_env = os.environ.copy()
    command = monaco_cli.MONACO_EXEC
    log_dir = dirs.prep_dir(dirs.get_monaco_exec_dir(), "log")
    log_file_path = dirs.get_file_path(
        log_dir, "terraform_provider_test_runnable", ".log"
    )
    log_label = "OneTopology test if is runnable"

    return monaco_cli_download.exec_one_topology(
        run_info,
        command,
        my_env,
        log_label,
        log_file_path,
    )
