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

import re
import time

import proxy
import tenant
from exception import RequestHeadersMissingError


def get_api_call_credentials(tenant_key, payload_type="application/json"):
    return get_call_credentials(tenant_key, payload_type, add_api_key)


def get_ui_api_call_credentials(tenant_key, payload_type="application/json"):
    return get_call_credentials(tenant_key, payload_type, extract_headers)


def get_call_credentials(tenant_key, payload_type, header_function):
    config, headers, tenant_data = init_headers_config(tenant_key)

    headers = header_function(tenant_data, headers)
    headers = add_content_type(headers, payload_type)

    config = create_util_config(config, headers)

    return config


def init_headers_config(tenant_key):
    tenant_data = tenant.load_tenant(tenant_key)

    headers = get_init_headers()

    config, headers = extract_config(tenant_key, tenant_data, headers)

    return config, headers, tenant_data


def extract_headers(tenant_data, headers):
    try:
        lines = tenant_data["headers"].splitlines()
    except KeyError:
        raise RequestHeadersMissingError("UI_API Request Headers not specified")

    # Strips the newline character
    header_prefixes = {
        "Cookie": "Cookie: ",
        "X-CSRFToken": "X-CSRFToken: ",
        "Tab-Id": "Tab-Id: ",
        "X-Last-Action": "X-Last-Action: ",
    }

    for line in lines:
        for key, prefix in header_prefixes.items():
            if line.startswith(prefix):
                headers[key] = line.partition(prefix)[2].rstrip()
                continue

    return headers


def create_util_config(config, headers):
    config["headers"] = headers

    if "timeframe" not in config:
        current_time = int(time.time() * 1000)
        days = 1
        previous_time = current_time - (1000 * 60 * 60 * 24 * days)
        config["timeframe"] = "custom" + str(previous_time) + "to" + str(current_time)

    if "gtf" not in config:
        config["gtf"] = "l_2_DAYS"

    if "throttle_delay" not in config:
        config["throttle_delay"] = 1

    if "purepath_limit" not in config:
        config["purepath_limit"] = 3000

    return config


def get_init_headers():
    init_headers = {
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36",
        "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="101", "Google Chrome";v="101"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    }

    return init_headers


def add_api_key(tenant_data, headers):
    headers["Authorization"] = "Api-Token " + tenant_data["APIKey"]

    return headers


def add_content_type(headers, payload_type):
    headers["Content-Type"] = payload_type + "; charset=utf-8"

    return headers


def extract_config(tenant_key, tenant_data, headers):
    config = tenant_data

    config["tenant_key"] = str(tenant_key)
    config["tenant"] = re.search(r"\/\/(.*?)\/", tenant_data["url"]).group(1)

    config_keys = {
        "Referer": "url",
    }

    if (
        "monacoConcurrentRequests" in tenant_data
        and type(tenant_data["monacoConcurrentRequests"]) == type(0)
        and tenant_data["monacoConcurrentRequests"] > 0
    ):
        config["monaco_concurrent_requests"] = tenant_data["monacoConcurrentRequests"]
    else:
        config["monaco_concurrent_requests"] = 10

    # Not using this feature currently, would have to adapt with OneTopology/Terraform 
    '''
    if (
        "disableSSLVerification" in tenant_data
        and tenant_data["disableSSLVerification"] == True
    ):
        config["verifySSL"] = False
    else:
        config["verifySSL"] = True
    '''
    config["verifySSL"] = None

    set_tenant_proxy(tenant_data, config)

    for key, config_key in config_keys.items():
        if config_key in tenant_data:
            headers[key] = tenant_data[config_key]

    return config, headers

def set_tenant_proxy(tenant_data, config):
    if (
        "disableSystemProxies" in tenant_data
        and tenant_data["disableSystemProxies"] == True
    ):
        config["proxies"] = {
            "http": "",
            "https": "",
        }

        config["proxy"] = ""
    else:
        if "proxyURL" in tenant_data and tenant_data["proxyURL"] != "":
            config["proxies"] = {
                "http": tenant_data["proxyURL"],
                "https": tenant_data["proxyURL"],
            }

            config["proxy"] = tenant_data["proxyURL"]
        else:
            env_proxy = proxy.get_proxy_from_env()

            config["proxies"] = {
                "http": env_proxy,
                "https": env_proxy,
            }
            config["proxy"] = env_proxy
