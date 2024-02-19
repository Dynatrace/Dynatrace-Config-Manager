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
from os import listdir
from os.path import isfile, join
import hashlib
import shutil
import os_helper

# Max length is 256 or 260, but it is on an escaped and decorated path
# Setting limit to 240 characters
MAX_LENGTH_WINDOWS = 240


def get_file_path(dir_path, filename, file_extension=".json", absolute=True):
    # On Windows, semi-colons are restricted
    filename = filename.replace(":", "_")
    path = forward_slash_join(dir_path, filename + file_extension, absolute=absolute)

    if is_path_too_long(path):
        filename = get_filename_hash(filename)
        # print("ERROR: PATH TOO LONG: ", path, "USING HASH: ", filename)
        path = forward_slash_join(
            dir_path, filename + file_extension, absolute=absolute
        )

        if is_path_too_long(path):
            raise OverflowError(
                "Path exceeds maximum length (Windows protection): " + path
            )

    return path


def get_filename_hash(filename):
    escaped_filename = filename.encode("unicode_escape")
    filename = str(int(hashlib.md5(escaped_filename).hexdigest(), 16))

    return filename


def get_forward_slash_cwd():
    return to_forward_slash(os.getcwd())


def is_path_too_long(path):
    if os_helper.IS_WINDOWS:
        escaped_path = path.encode("unicode_escape")
        return len(escaped_path) > MAX_LENGTH_WINDOWS
    else:
        return False


def get_monaco_exec_dir():
    return prep_dir(get_forward_slash_cwd(), "..", "one-topology")


def get_terraform_exec_dir():
    return prep_dir(get_forward_slash_cwd(), "..", "terraform")


def get_terraform_cache_dir():
    return prep_dir(get_forward_slash_cwd(), "..", "tf-cache-dir")


def get_data_dir():
    return prep_dir(get_forward_slash_cwd(), "..", "data")


def get_tenant_list_dir():
    return prep_dir(get_data_dir(), "tenant_list")


def get_options_dir():
    return prep_dir(get_data_dir(), "options")


def get_tenant_data_dir():
    return prep_dir(get_data_dir(), "cache")


def get_tenant_data_cache_dir(config):
    return prep_dir(get_tenant_data_dir(), config["tenant_key"])


def get_tenant_data_cache_sub_dir(config, sub_dir):
    return prep_dir(get_tenant_data_cache_dir(config), sub_dir)


def get_tenant_work_dir():
    return prep_dir(get_data_dir(), "work")


def get_tenant_work_cache_dir(config_main, config_target):
    return prep_dir(
        get_tenant_work_dir(),
        config_main["tenant_key"] + "-" + config_target["tenant_key"],
    )


def get_tenant_work_cache_sub_dir(config_main, config_target, sub_dir):
    return prep_dir(get_tenant_work_cache_dir(config_main, config_target), sub_dir)


def get_log_list_dir():
    return prep_dir(get_data_dir(), "log_list")


def get_log_data_dir(config):
    return prep_dir(get_log_list_dir(config), "log_data")


def prep_dir(path, *paths, absolute=True):
    path = forward_slash_join(path, *paths, absolute=absolute)
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
    return path


def list_files_in_dir(path):
    files = [f for f in listdir(path) if isfile(join(path, f))]

    return files


def forward_slash_join(path, *paths, absolute=True):
    path = os.path.join(path, *paths)
    if absolute:
        path = os.path.abspath(path)
    return to_forward_slash(path)


def to_forward_slash(path):
    return path.replace("\\", "/")


def to_backward_slash(path):
    return path.replace("/", "\\")


def copy_tree(src, dest, overwrite=False):
    if not os.path.exists(dest):
        os.makedirs(dest)

    for item in os.listdir(src):
        source_item = os.path.join(src, item)
        destination_item = os.path.join(dest, item)

        if os.path.isdir(source_item):
            copy_tree(source_item, destination_item)
        else:
            if os.path.exists(destination_item):
                if overwrite:
                    pass
                else:
                    continue
            shutil.copy2(source_item, destination_item)


def print_path_too_long_message_cond(path):
    if is_path_too_long(path):
        print(
            "File name probably too long, try moving the tool closer to the root of the drive. File:",
            path,
        )
