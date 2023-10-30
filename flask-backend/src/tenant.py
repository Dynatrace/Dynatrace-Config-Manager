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
import time

import dirs

MAX_RETRIES = 5


def load_tenant_list():
    retry_count = 0
    tenant_list = {}
    while retry_count < MAX_RETRIES:
        try:
            tenant_list = _load_tenant_list()
            break
        except Exception as e:
            retry_count += 1
            time.sleep(1)

    return tenant_list


def _load_tenant_list():
    tenant_list = {}

    try:
        with open(
            dirs.get_tenant_list_dir() + "/list.json", "r", encoding="UTF-8"
        ) as file_tenant_list:
            tenant_list = json.load(file_tenant_list)
    except FileNotFoundError as e:
        save_tenant_list(tenant_list)

    return tenant_list


def load_tenant(key):
    tenant_list = load_tenant_list()

    tenant_data = tenant_list["tenants"][key]

    return tenant_data


def save_tenant_list(payload):
    with open(
        dirs.get_tenant_list_dir() + "/list.json", "w", encoding="UTF-8"
    ) as file_tenant_list:
        file_tenant_list.write(json.dumps(payload))
