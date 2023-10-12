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

import settings_2_0
import json
import re
import process_utils


def match_config(run_info):

    _, all_tenant_config_dict = process_utils.execute_match(run_info,
                                                            LoadConfig,
                                                            settings_2_0.extract_function,
                                                            live_extract=False)

    return all_tenant_config_dict


def match_config_forced_live(run_info):

    _, all_tenant_config_dict = process_utils.execute_match(run_info,
                                                            LoadConfig,
                                                            settings_2_0.extract_specific_scope,
                                                            live_extract=True)

    return all_tenant_config_dict


class LoadConfig(dict):

    def __init__(self, run_info):

        self['entity_config_index'] = {}
        self['config_entity_index'] = {}
        self['multi_matched_schemas'] = {}
        self['key_not_found_schemas'] = {}
        self['multi_matched_objects'] = {}
        self['multi_matched_key_id_object'] = {}
        self['management_zone_objects'] = {}
        self['configs'] = {}
        self['entities'] = {}
        self['forced_schema_id'] = run_info['forced_schema_id']
        self['forced_key_id'] = run_info['forced_key_id']

        analysis_filter = run_info['analysis_filter']
        if (analysis_filter.is_target_tenant == True):
            self['forced_entity_id'] = run_info['forced_entity_id_target']
        else:
            self['forced_entity_id'] = run_info['forced_entity_id_main']

        analysis_filter = run_info['analysis_filter']
        self['schemas_definitions_dict'] = process_utils.get_tenant_schemas_definitions_dict(
            run_info, analysis_filter.is_target_tenant)

        unique_entity_filter_str = ""
        nb_unique_entity = 0
        for entity in analysis_filter.entity_type_list:

            if (entity in process_utils.UNIQUE_ENTITY_LIST):
                nb_unique_entity += 1
                if (nb_unique_entity > 1):
                    unique_entity_filter_str += '|'
                unique_entity_filter_str += entity

        self['entity_filter_regex_list'] = []
        if (nb_unique_entity > 0):
            # This Regex has an empty group, it is because there is no type for unique entities
            # But we still want to return 2 values to match the entity regex
            self['entity_filter_regex_list'].append(r'"scope": "(' +
                                                    unique_entity_filter_str + ')()"')

        self['entity_filter_regex_list'].append(
            r'(((?:[A-Z]+_)?(?:[A-Z]+_)?(?:[A-Z]+_)?[A-Z]+)-[0-9A-Z]{16})')

        self['management_zone_regex'] = r'(?:mzId\((?:[-]{1})?\d+)|("managementZones": \[[^\]]+\])|(managementZone": "(?:[-]{1})?\d+)'

    def analyze(self, config_data):

        if ('errorCode' in config_data):
            print("Error for ", config_data)
            return

        for conf_object in config_data['items']:

            entityId = conf_object['scope']
            schema_id = conf_object['schemaId']
            main_key_value = self.get_main_key_value(conf_object)
            object_id = conf_object['objectId']

            if (self.is_forced_filtered_out(entityId, schema_id, main_key_value)):
                continue

            object_string = json.dumps(conf_object)

            self.extract_entities(object_id, object_string,
                                  conf_object, schema_id, main_key_value)

            self.extract_management_zone(object_id, object_string)

    def is_forced_filtered_out(self, entity_id, schema_id, main_key_value):

        if (self['forced_entity_id'] is None):
            pass
        elif (self['forced_entity_id'] == entity_id):
            pass
        else:
            return True

        if (self['forced_schema_id'] is None):
            pass
        elif (self['forced_schema_id'] == schema_id):
            pass
        else:
            return True

        if (self['forced_key_id'] is None):
            pass
        elif (self['forced_key_id'] == main_key_value):
            pass
        else:
            return True

        return False

    def extract_management_zone(self, object_id, object_string):

        matches = re.findall(self['management_zone_regex'], object_string)

        if (len(matches) > 0):
            self['management_zone_objects'][object_id] = True

    def extract_entities(self, object_id, object_string, conf_object, schema_id, main_key_value):

        for entity_filter_regex in self['entity_filter_regex_list']:

            matches = re.findall(entity_filter_regex,
                                 object_string)

            if (len(matches) > 0):

                self.add_config(object_id, conf_object)

                for match in matches:
                    entity_id, entity_type = match

                    if (entity_type == ""):
                        entity_type = entity_id

                    self.add_entity(entity_type, entity_id)

                    self.add_entity_config_index(
                        entity_type, schema_id, entity_id, main_key_value, object_id)

                    self.add_config_entity_index(object_id, entity_id)

    def get_results(self):
        return self

    def get_main_key_value(self, conf_object):

        schema_id = conf_object['schemaId']

        multi_ordered = False
        multi_object = False
        if (schema_id in self['schemas_definitions_dict']['ordered_schemas']):
            multi_ordered = True

        elif (schema_id in self['schemas_definitions_dict']['multi_object_schemas']):
            multi_object = True

        main_key_value = ""
        if (multi_object or multi_ordered):

            main_key_list = self['schemas_definitions_dict']['main_keys'][schema_id]

            if (len(main_key_list) > 0):
                main_key = main_key_list[0]

                if (main_key in conf_object['value']):
                    main_key_value = conf_object['value'][main_key]

            if (main_key_value == ""):
                self['key_not_found_schemas'][schema_id] = True

        return main_key_value

    def add_config(self, object_id, conf_object):

        if (object_id in self['configs']):
            self['multi_matched_objects'][object_id] = True
        else:
            self['configs'][object_id] = conf_object

    def add_entity(self, entity_type, entity_id):

        if (entity_type in self['entities']):
            pass
        else:
            self['entities'][entity_type] = {}

        if (entity_id in self['entities'][entity_type]):
            pass
        else:
            self['entities'][entity_type][entity_id] = False

    def add_schema_to_index(self, index_type, type, schema_id):
        if (type in self[index_type]):
            pass
        else:
            self[index_type][type] = {}

        if (schema_id in self[index_type][type]):
            pass
        else:
            self[index_type][type][schema_id] = {}

    def add_entity_config_index(self, type, schema_id, entity_id, main_key_value, object_id):

        index_type = 'entity_config_index'

        self.add_schema_to_index(index_type, type, schema_id)

        if (entity_id in self[index_type][type][schema_id]):
            pass
        else:
            self[index_type][type][schema_id][entity_id] = {}

        if (main_key_value in self[index_type][type][schema_id][entity_id]):
            pass
        else:
            self[index_type][type][schema_id][entity_id][main_key_value] = []

        if (object_id in self[index_type][type][schema_id][entity_id][main_key_value]):
            pass
        else:
            self[index_type][type][schema_id][entity_id][main_key_value].append(
                object_id)

            if (len(self[index_type][type][schema_id][entity_id][main_key_value]) > 1):
                print("Schema has multiple identical key_ids: ",
                      schema_id, entity_id, main_key_value, object_id)
                # self['multi_matched_schemas'][schema_id] = True
                self['multi_matched_key_id_object'][object_id] = True
                if (len(self[index_type][type][schema_id][entity_id][main_key_value]) == 2):
                    previous_object_id = self[index_type][type][schema_id][entity_id][main_key_value][0]
                    self['multi_matched_key_id_object'][previous_object_id] = True

    def add_config_entity_index(self, object_id, entity_id):

        if (object_id in self['config_entity_index']):
            pass
        else:
            self['config_entity_index'][object_id] = {}

        if (entity_id in self['config_entity_index'][object_id]):
            pass
        else:
            self['config_entity_index'][object_id][entity_id] = ""
