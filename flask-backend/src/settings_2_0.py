
import api_v2
import handler_api
import settings_2_0_schemas


def extract_function(config, use_cache, cache_only, analysis_object, input_params=None, run_info=None):

    schema_dict = settings_2_0_schemas.extract_schemas(
        config, use_cache=cache_only, cache_only=cache_only)

    _ = extract_configs(
        schema_id_query_dict_extractor, config, schema_dict, use_cache, cache_only, analysis_object)

    return schema_dict


def extract_specific_scope(config, use_cache, cache_only, analysis_object, scope, run_info=None):

    scope_array = []

    scope_array = add_scope_to_extract(scope, scope_array, run_info)
    scope_array = add_scope_to_extract('environment', scope_array, run_info)

    scope_dict = {"items": []}

    for input_scope in scope_array:
        scope_dict["items"].append({"scope": input_scope})

    _ = extract_configs(
        scope_query_dict_extractor, config, scope_dict, use_cache, cache_only, analysis_object)

    return scope_dict


def add_scope_to_extract(scope, scope_array, run_info):

    if (scope == 'environment'):
        if (run_info is None):
            pass
        elif (run_info['use_environment_cache'] == True):
            return scope_array

    if (scope in scope_array):
        pass
    else:
        scope_array.append(scope)

    return scope_array


def extract_configs(item_id_extractor, config, input_dict, use_cache, cache_only, analysis_object=None):

    handler_api.extract_pages_from_input_list(
        config, input_dict['items'],
        'objects', api_v2.settings_objects, item_id_extractor,
        use_cache, cache_only, analysis_object)

    return None


def schema_id_query_dict_extractor(item):

    item_id = item['schemaId']

    query_dict = {}
    query_dict['schemaIds'] = item_id
    query_dict['fields'] = "objectId,scope,schemaId,value,schemaVersion"

    url_trail = None

    return item_id, query_dict, url_trail


def scope_query_dict_extractor(item):

    scope = item['scope']

    query_dict = {}
    query_dict['scopes'] = scope
    query_dict['fields'] = "objectId,scope,schemaId,value,schemaVersion"

    url_trail = None

    return scope, query_dict, url_trail
