from enum import unique
import settings_2_0_schemas
import process_utils
import process_analysis


def analyze_schemas(run_info):

    _, schemas_definitions_dict = process_utils.execute_match(run_info,
                                                            LoadSchemas,
                                                            settings_2_0_schemas.extract_function)

    return schemas_definitions_dict


class LoadSchemas(dict):

    def __init__(self, run_info):

        self['multi_object_schemas'] = {}
        self['ordered_schemas'] = {}
        self['schemas'] = {}
        self['main_keys'] = {}

    def analyze(self, config_data):

        if('errorCode' in config_data
           or ('error' in config_data
               and 'code' in config_data['error']
               and config_data['error']['code'] >= 400)):
            print("Error for ", config_data)
        else:
            schema_id = config_data['schemaId']
            self['schemas'][schema_id] = config_data

            try:
                if(config_data['ordered'] == True):
                    self['ordered_schemas'][schema_id] = True
            except KeyError:
                pass

            try:
                if(config_data['multiObject'] == True):
                    self['multi_object_schemas'][schema_id] = True
            except KeyError:
                pass
            
            try:
                keys_list = list(config_data['properties'].keys())
                main_key_list, _ = process_analysis.get_main_key_from_list(keys_list, max=1)
                self['main_keys'][schema_id] = main_key_list
                
            except KeyError:
                pass

    def get_results(self):
        
        return self
