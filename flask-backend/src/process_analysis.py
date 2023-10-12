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


class ScopeAnalysis:

    def __init__(self):

        self.results = {}

    def analyze(self, schema_objects_data):
        if ('errorCode' in schema_objects_data):
            print("Error for ", schema_objects_data)
        else:
            objects_list = schema_objects_data['items']
            for object in objects_list:
                scope = object['scope']
                if (scope in self.results):
                    self.results[scope]['nb'] += 1
                else:
                    self.results[scope] = {'scope': scope, 'nb': 1}

    def get_results(self):
        return self.results


class ScopeTypeAnalysis:

    def __init__(self):

        self.results = {}

    def analyze(self, schema_objects_data):
        if ('errorCode' in schema_objects_data):
            print("Error for ", schema_objects_data)
        else:
            objects_list = schema_objects_data['items']
            for object in objects_list:
                scope = object['scope']

                scope_type = None

                regex_list = []

                regex_list.append(r'([A-Z]{1}[^-]*-)(.*)')
                regex_list.append(r'(metric-)(.*)')
                regex_list.append(r'(user-)(.*)')
                regex_list.append(r'([a-z\-][^:]*:)(.*)')
                regex_list.append(r'([a-z\-][^\.]*\.)(.*)')

                for regex in regex_list:
                    m = re.search(regex, scope)

                    if (m == None):
                        print("Not Match: ", scope)
                    else:
                        scope_type = m.group(1)
                        break

                if (scope_type is None):
                    scope_type = scope

                if (scope_type in self.results):
                    self.results[scope_type]['nb'] += 1
                else:
                    self.results[scope_type] = {
                        'scope': scope_type, 'nb': 1, 'example': scope}

    def get_results(self):
        return self.results


class KeyAnalysis:

    def __init__(self):

        self.results = {}

    def analyze(self, schema_objects_data):
        if ('errorCode' in schema_objects_data):
            print("Error for ", schema_objects_data)
        else:
            objects_list = schema_objects_data['items']
            for object in objects_list:
                schemaId = object['schemaId']
                if (schemaId in self.results):
                    pass
                else:
                    self.results[schemaId] = {}

                main_key_list, _ = extract_main_object_key(object)

                for main_key in main_key_list:
                    if (main_key in self.results[schemaId]):
                        self.results[schemaId][main_key]['nb'] += 1
                    else:
                        self.results[schemaId][main_key] = {
                            'mainKey': main_key, 'nb': 1}

    def get_results(self):
        return self.results


main_object_key_regex_list = []

main_object_key_regex_list.append(r'(^[Nn]ame$)')
main_object_key_regex_list.append(r'(^[Kk]ey$)')
main_object_key_regex_list.append(r'(^[Ss]ummary$)')
main_object_key_regex_list.append(r'(^[Ll]abel$)')
main_object_key_regex_list.append(r'(^[Tt]itle$)')
main_object_key_regex_list.append(r'(^[Pp]attern$)')
main_object_key_regex_list.append(r'(^.*[Nn]ame$)')
main_object_key_regex_list.append(r'(^.*[Kk]ey$)')
main_object_key_regex_list.append(r'(^.*[Ss]ummary$)')
main_object_key_regex_list.append(r'(^.*[Ll]abel$)')
main_object_key_regex_list.append(r'(^.*[Tt]itle$)')
main_object_key_regex_list.append(r'(^.*[Pp]attern$)')


def extract_main_object_key(object, max=None):
    value = object['value']
    value_keys_list = list(value.keys())

    main_key_list, main_key_value = get_main_key_from_list(value_keys_list, value, max)

    return main_key_list, main_key_value

def get_main_key_from_list(key_list, dict=None, max=None):
    
    main_key_list = []
    main_key_value = ""
    
    for regex in main_object_key_regex_list:
        for value_key in key_list:

            m = re.search(regex, value_key)

            if (m == None):
                pass
            else:
                main_key_list.append(value_key)
                if(dict is None):
                    pass
                else:                
                    main_key_value += dict[value_key]
                break

        if (len(main_key_list) >= max):
            break

    return main_key_list, main_key_value