import credentials
import dirs
import json
import monaco_cli
import monaco_cli_download
import monaco_cli_match
import os
import yaml


def get_path_entities_local(config):
    path = dirs.forward_slash_join(
        monaco_cli_download.get_path_entities(config), monaco_cli.PROJECT_NAME)
    return path


def analyze_entities(config, analysis_object):
    path_entities_local = get_path_entities_local(config)
    run_on_all_sub_files(path_entities_local, analysis_object)


def load_matched_entities(tenant_key_target, tenant_key_main):

    if (tenant_key_main == None):
        tenant_key_main = tenant_key_target

    config_target = credentials.get_api_call_credentials(tenant_key_target)
    config_main = credentials.get_api_call_credentials(tenant_key_main)
    matched_analysis_object = LoadMatchedEntities(tenant_key_main)

    path_matched_entities_local = monaco_cli_match.get_path_match_entities(
        config_main, config_target)
    run_on_all_sub_files(path_matched_entities_local, matched_analysis_object)

    results = matched_analysis_object.get_results()

    metadata_analysis_object = LoadEntitiesMetadata()
    metadata_analysis_object.setCurrentTenant('target')
    path_entities_local = get_path_entities_local(config_target)
    run_on_all_sub_files(path_entities_local,
                         metadata_analysis_object, '.yaml')
    metadata_analysis_object.setCurrentTenant('source')
    path_entities_local = get_path_entities_local(config_main)
    run_on_all_sub_files(path_entities_local,
                         metadata_analysis_object, '.yaml')

    results_metadata = metadata_analysis_object.get_results()

    for entities_type, entity_match_key in results['match_key'].items():
        for tenant_type, tenant_match_key in entity_match_key.items():
            for key, key_value in tenant_match_key.items():

                entities_metadata_key_value = ""
                if (tenant_type in results_metadata['match_key'][entities_type]):
                    entities_metadata_key_value = results_metadata[
                        'match_key'][entities_type][tenant_type][key]

                if (key_value == entities_metadata_key_value):
                    pass
                else:
                    print("Must Rerun, reason: ", tenant_type, key_value, entities_metadata_key_value)
                    return True, ({}, {})

    return False, (results['matched_entities'], results['entities_dict'])


def load_matched_configs(tenant_key_target, tenant_key_main):

    config_main = credentials.get_api_call_credentials(tenant_key_main)
    config_target = credentials.get_api_call_credentials(tenant_key_target)

    path_UI_payload = monaco_cli_match.get_path_match_configs_UI_payload(
        config_main, config_target)

    path_UI_payload_file = dirs.get_file_path(path_UI_payload, "payload")
    
    cached_data = None

    #try:
    #    cached_data = get_cached_data(path_UI_payload_file, '.json')
    #except FileNotFoundError as e:
    #    return True, (cached_data)

    return False, (cached_data)


def run_on_all_sub_files(path, analysis_object, file_extension=".json"):
    sub_dirs = os.scandir(path)

    for sub_dir in sub_dirs:
        if (sub_dir.is_dir()):
            sub_files = os.scandir(sub_dir)

            for sub_file in sub_files:
                if (file_extension in sub_file.path):
                    analyse_cached_file(
                        analysis_object, sub_file, file_extension)


def analyse_cached_file(analysis_object, sub_file, file_extension):
    cached_data = get_cached_data(sub_file, file_extension)

    if (analysis_object is None
            or cached_data is None):
        pass
    else:
        analysis_object.analyze(cached_data)


def get_cached_data(sub_file, file_extension='.json', file_expected=True):
    cached_data = None

    try:
        with open(sub_file, 'r', encoding='UTF-8') as f:
            if (file_extension == '.json'):
                cached_data = json.load(f)
            elif (file_extension == '.yaml'):
                cached_data = yaml.safe_load(f)

    except FileNotFoundError as e:
        if(file_expected):
            print("File name probably too long, try moving the tool closer to the root of the drive.")
            raise e

    return cached_data


class LoadMatchedEntities:

    def __init__(self, tenant_key):

        self.tenant_key = tenant_key
        self.results = {}
        self.results['matched_entities'] = {}
        self.results['entities_dict'] = {tenant_key: {}}
        self.results['match_key'] = {}

    def analyze(self, entities_data):
        entity_type = ""

        if ('type' in entities_data):
            entity_type = entities_data['type']
        else:
            return

        if ('matchKey' in entities_data and 'source' in entities_data['matchKey'] and 'target' in entities_data['matchKey']):
            self.results['match_key'][entity_type] = entities_data['matchKey']

        self.results['matched_entities'][entity_type] = {}

        if ('matches' in entities_data):
            for target_id, source_id in entities_data['matches'].items():
                self.results['entities_dict'][self.tenant_key][target_id] = ''

                match_type = 2
                if (target_id == source_id):
                    match_type = 1

                self.results['matched_entities'][entity_type][target_id] = {'match_entity_list': {
                    source_id: {'top_match': True, 'only_top_match': True}}, 'match_type': match_type}

        if ('multiMatched' in entities_data):
            for target_id, source_list in entities_data['multiMatched'].items():
                self.results['entities_dict'][self.tenant_key][target_id] = ''

                match_type = 3
                self.results['matched_entities'][entity_type][target_id] = {
                    'match_entity_list': {}, 'match_type': match_type}

                for source_id in source_list:
                    self.results['matched_entities'][entity_type][target_id]['match_entity_list'][source_id] = {
                        'top_match': True}

        if ('unmatched' in entities_data):
            for target_id in entities_data['unmatched']:
                self.results['entities_dict'][self.tenant_key][target_id] = ''

                match_type = 6
                self.results['matched_entities'][entity_type][target_id] = {
                    'match_entity_list': {}, 'match_type': match_type}

    def get_results(self):
        return self.results


class LoadEntitiesMetadata:

    def __init__(self):

        self.results = {}
        self.results['match_key'] = {}
        self.currentTenant = 'None'

    def setCurrentTenant(self, tenantType):
        self.currentTenant = tenantType

    def analyze(self, entities_metadata):
        entity_type = ""

        if ('configs' in entities_metadata):
            pass
        else:
            return

        if (entities_metadata['configs'][0] and 'type' in entities_metadata['configs'][0]):
            pass
        else:
            return

        if ('entities' in entities_metadata['configs'][0]['type']):
            pass
        else:
            return

        current_match_key = {}

        if ('entitiesType' in entities_metadata['configs'][0]['type']['entities']):
            entity_type = entities_metadata['configs'][0]['type']['entities']['entitiesType']
        else:
            return

        if ('from' in entities_metadata['configs'][0]['type']['entities']
           and 'to' in entities_metadata['configs'][0]['type']['entities']):
            current_match_key = {
                'from': entities_metadata['configs'][0]['type']['entities']['from'],
                'to':   entities_metadata['configs'][0]['type']['entities']['to'],
            }

        else:
            current_match_key = {
                'from': '',
                'to':   '',
            }

        if (entity_type in self.results['match_key']):
            pass
        else:
            self.results['match_key'][entity_type] = {}

        self.results['match_key'][entity_type][self.currentTenant] = current_match_key

    def get_results(self):
        return self.results
