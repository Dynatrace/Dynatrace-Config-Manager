from enum import unique
import settings_2_0_schemas
import process_utils


def analyze_schemas(run_info, analysis_filter):

    _, schemas_definitions_dict = process_utils.execute_match(run_info,
                                                            LoadSchemas, analysis_filter,
                                                            settings_2_0_schemas.extract_function,
                                                            live_extract=False)

    return schemas_definitions_dict


class LoadSchemas(dict):

    def __init__(self, analysis_filter):

        self['multi_object_schemas'] = {}
        self['ordered_schemas'] = {}
        self['schemas'] = {}

    def analyze(self, config_data):

        if('errorCode' in config_data):
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

    def get_results(self):
        
        return self
