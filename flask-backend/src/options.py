import dirs
import json


def load_execution_options():

    execution_options = {}
    try:
        with open(dirs.get_options_dir() + '/execution_options.json', 'r') as file_execution_options:
            execution_options = json.load(file_execution_options)
    except:
        pass

    return execution_options


def save_execution_options(payload):

    with open(dirs.get_options_dir() + '/execution_options.json', 'w') as file_execution_options:
        file_execution_options.write(json.dumps(payload))


def load_global_settings():

    global_settings = {}
    try:
        with open(dirs.get_options_dir() + '/global_settings.json', 'r') as file_global_settings:
            global_settings = json.load(file_global_settings)
    except:
        pass

    return global_settings


def save_global_settings(payload):

    with open(dirs.get_options_dir() + '/global_settings.json', 'w') as file_global_settings:
        file_global_settings.write(json.dumps(payload))


def load_entity_filter():

    entity_filter = {}
    try:
        with open(dirs.get_options_dir() + '/entity_filter.json', 'r') as file_entity_filter:
            entity_filter = json.load(file_entity_filter)
    except:
        pass

    return entity_filter


def save_entity_filter(payload):

    with open(dirs.get_options_dir() + '/entity_filter.json', 'w') as file_entity_filter:
        file_entity_filter.write(json.dumps(payload))
