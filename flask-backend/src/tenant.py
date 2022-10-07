import dirs
import json


def load_tenant_list():

    tenant_list = {}

    try:
        with open(dirs.get_tenant_list_dir() + '/list.json', 'r') as file_tenant_list:
            tenant_list = json.load(file_tenant_list)
    except FileNotFoundError as e:
        save_tenant_list(tenant_list)

    return tenant_list


def load_tenant(key):

    tenant_list = load_tenant_list()

    tenant_data = tenant_list['tenants'][key]

    return tenant_data


def save_tenant_list(payload):

    with open(dirs.get_tenant_list_dir() + '/list.json', 'w') as file_tenant_list:
        file_tenant_list.write(json.dumps(payload))
