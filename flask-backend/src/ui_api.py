import requests
import json

# SERVICE
entity_details = "rest/configuration/deployment/entities"
# Ajouter: /SERVICE/SERVICE-97A55F7A43425D84


def get(config, api, url_trail):

    call_url = config['url'] + api + url_trail

    response = requests.request("GET", call_url, headers=config['headers'])
    if(response.status_code == 404):
        pass
    else:
        response.raise_for_status()

    return response


def _post_put(config, api, url_trail, payload, method):

    call_url = config['url'] + api + url_trail

    response = requests.request(
        method, call_url, headers=config['headers'], data=payload)

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
