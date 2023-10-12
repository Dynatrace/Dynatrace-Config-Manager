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

import requests
import json

# SERVICE
entity_details = "rest/configuration/deployment/entities"
# Ajouter: /SERVICE/SERVICE-97A55F7A43425D84


def get(config, api, url_trail):

    call_url = config['url'] + api + url_trail

    response = requests.request("GET", call_url, headers=config['headers'], verify=config['verifySSL'], proxies=config['proxies'])
    if(response.status_code == 404):
        pass
    else:
        response.raise_for_status()

    return response


def _post_put(config, api, url_trail, payload, method):

    call_url = config['url'] + api + url_trail

    response = requests.request(
        method, call_url, headers=config['headers'], data=payload, verify=config['verifySSL'], proxies=config['proxies'])

    if(response.status_code == 404):
        pass
    else:
        response.raise_for_status()

    return response


def post(config, api, url_trail, payload):
    return _post_put(config, api, url_trail, payload, 'POST')


def put(config, api, url_trail, payload):
    return _post_put(config, api, url_trail, payload, 'PUT')


def get_json(config, api, url_trail):

    response = get(config, api, url_trail)
    response_object = json.loads(response.text)

    return response_object


def post_json(config, api, url_trail, payload):

    response = post(config, api, url_trail, payload)
    response_object = json.loads(response.text)

    return response_object
