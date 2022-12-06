import api_v2
import handler_api

NO_CACHE_ONLY_SCHEMAS = False
NO_CACHE_SCHEMA_LIST = False

def extract_schemas(config, use_cache=True, cache_only=False):
    schema_dict = handler_api.extract_basic_json(
        config, api_v2.settings_schemas, 'settings_schemas',
        use_cache, cache_only)

    return schema_dict


def extract_function(config, use_cache, cache_only, analysis_object, input_params=None, run_info=None):

    schema_dict = extract_schemas(
        config, NO_CACHE_SCHEMA_LIST, NO_CACHE_ONLY_SCHEMAS)

    _ = extract_schema_definitions(
        schema_id_url_trail_extractor, config, schema_dict, use_cache, NO_CACHE_ONLY_SCHEMAS, analysis_object)

    return schema_dict


def extract_schema_definitions(item_id_extractor, config, input_dict, use_cache, cache_only, analysis_object=None):

    handler_api.extract_pages_from_input_list(
        config, input_dict['items'],
        'schema_definitions', api_v2.settings_schemas, item_id_extractor,
        use_cache, cache_only=NO_CACHE_ONLY_SCHEMAS, analysis_object=analysis_object)

    return None


def schema_id_url_trail_extractor(item):
    item_id = item['schemaId']

    query_dict = {}

    url_trail = "/" + item_id

    return item_id, query_dict, url_trail
