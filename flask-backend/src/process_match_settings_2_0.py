from enum import unique
import settings_2_0
import json
import re
import process_utils


def match_config(run_info, analysis_filter):

    _, all_tenant_config_dict = process_utils.execute_match(run_info,
                                                            LoadConfig, analysis_filter,
                                                            settings_2_0.extract_function,
                                                            live_extract=False)

    return all_tenant_config_dict


def match_config_forced_live(run_info, analysis_filter):

    _, all_tenant_config_dict = process_utils.execute_match(run_info,
                                                            LoadConfig, analysis_filter,
                                                            settings_2_0.extract_specific_scope,
                                                            live_extract=True)

    return all_tenant_config_dict


class LoadConfig(dict):

    def __init__(self, analysis_filter):

        self['entity_config_index'] = {}
        self['config_entity_index'] = {}
        self['configs'] = {}

        entity_filter_str = ""
        unique_entity_filter_str = ""
        nb_entity = 0
        nb_unique_entity = 0
        for entity in analysis_filter.entity_type_list:
            is_unique = False
            
            if(entity in process_utils.UNIQUE_ENTITY_LIST):
                is_unique = True
            
            if(is_unique):
                nb_unique_entity += 1
                if(nb_unique_entity > 1):
                    unique_entity_filter_str += '|'
                unique_entity_filter_str += entity
            else:
                nb_entity += 1
                if(nb_entity > 1):
                    entity_filter_str += '|'
                entity_filter_str += entity
        
        if(nb_unique_entity > 0):
            self['entity_filter_regex'] = r'"scope": "(' + \
                unique_entity_filter_str + ')()".*'
        else:
            self['entity_filter_regex'] = r'((' + \
                entity_filter_str + ')-[A-Z0-9]*)'
                
        if(nb_unique_entity > 0 and nb_entity > 0):
            print("ERROR: Unique entities mixed with entities: ",  analysis_filter.entity_type_list)

    def analyze(self, config_data):
        
        if('errorCode' in config_data):
            print("Error for ", config_data)
        else:
            for object in config_data['items']:

                object_string = json.dumps(object)
                # r"((APPLICATION|HOST|PROCESS_GROUP|SERVICE)-[A-Z0-9]*)",
                matches = re.findall(self['entity_filter_regex'],
                                     object_string)

                object_id = object['objectId']

                if(len(matches) > 0):

                    self.add_config(object_id, object)

                    for match in matches:
                        entity_id, entity_type = match
                        
                        if(entity_type == ""):
                            entity_type = entity_id
                            
                        self.add_index('entity_config_index',
                                       entity_type, object['schemaId'], entity_id, object_id)
                        self.add_index('config_entity_index',
                                       entity_type, object['schemaId'], object_id, entity_id)

    def get_results(self):
        return self

    def add_config(self, object_id, object):

        if(object_id in self['configs']):
            raise KeyError("Duplicate object id")

        self['configs'][object_id] = object

    def add_schema_to_index(self, index_type, type, schema_id):
        if(type in self[index_type]):
            pass
        else:
            self[index_type][type] = {}

        if(schema_id in self[index_type][type]):
            pass
        else:
            self[index_type][type][schema_id] = {}

    def add_index(self, index_type, type, schema_id, key_id, value_id):
        self.add_schema_to_index(index_type, type, schema_id)

        if(key_id in self[index_type][type][schema_id]):
            pass
        else:
            self[index_type][type][schema_id][key_id] = []

        if(value_id in self[index_type][type][schema_id][key_id]):
            pass
        else:
            self[index_type][type][schema_id][key_id].append(value_id)
