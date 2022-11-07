import dirs
import credentials
import cache
import api_v2


def pull(tenant_key, extract_function, use_cache=False, input_params=None):

    cache_only = False
    analysis_object = None

    output_data, _ = pull_analysis(
        tenant_key, extract_function, analysis_object, use_cache, cache_only, input_params)

    return output_data


def analyze(tenant_key, extract_function, analysis_object, input_params=None):

    use_cache = True
    cache_only = True

    _, analysis_result = pull_analysis(
        tenant_key, extract_function, analysis_object, use_cache, cache_only, input_params)

    return analysis_result


def extract_basic_json(config, api_endpoint, label, use_cache, cache_only):

    cache_path = dirs.get_tenant_data_cache_sub_dir(config, label)
    cache_path = dirs.get_file_path(cache_path, label)

    def extract_function():
        return api_v2.get_json(config, api_endpoint, "")

    result_json = cache.get_cached_data(
        use_cache, cache_only, cache_path, label, extract_function)

    return result_json


def pull_analysis(tenant_key, extract_function, analysis_object, use_cache, cache_only, input_params=None):

    config = credentials.get_api_call_credentials(tenant_key)

    output_data = extract_function(
        config, use_cache, cache_only, analysis_object, input_params)

    analysis_result = None

    if(analysis_object is not None):
        analysis_result = analysis_object.get_results()

    return output_data, analysis_result


def extract_pages_from_input_list(config, input_list, label, api_endpoint,
                                  item_id_query_dict_extractor,
                                  use_cache, cache_only, analysis_object,
                                  post_process_function=None):

    if(input_list is None):
        input_list = [{'itemId': 0}]

    for item in input_list:

        page_id = 0
        page_dict = extract_page_for_item(
            config, use_cache, cache_only,
            label, api_endpoint, item_id_query_dict_extractor, item, page_id,
            analysis_object, post_process_function)

        while(page_dict and 'nextPageKey' in page_dict):
            page_id += 1
            page_dict = extract_page_for_item(
                config, use_cache, cache_only,
                label, api_endpoint, item_id_query_dict_extractor, item, page_id,
                analysis_object, post_process_function, page_dict['nextPageKey'])

    return None

def add_to_str(trail, added_str):
    if(added_str == None
       or added_str == ''):
        return trail
    
    if(trail == ''):
        pass
    else:
        trail += '_'
    
    trail += added_str
    
    return trail

def extract_page_for_item(config, use_cache, cache_only,
                          label, api_endpoint, item_id_query_dict_extractor, item, page_id,
                          analysis_object, post_process_function=None, nextPageKey=None):

    item_id, init_query_dict, url_trail = item_id_query_dict_extractor(item)
    cache_path = dirs.get_tenant_data_cache_sub_dir(
        config, label)

    trail = ''

    trail = add_to_str(trail, item_id)
    trail = add_to_str(trail, 'page_' + str(page_id))

    cache_path = dirs.get_file_path(cache_path, trail)
    log_label = label + ' ' + trail

    result_dict = None
    
    if(url_trail is None):
        url_trail = ""

    def extract_function():
        
        query_dict = {}

        if(page_id == 0):
            query_dict = init_query_dict
        else:
            query_dict['nextPageKey'] = nextPageKey

        return api_v2.get_json(
            config, api_endpoint, "", query_dict)

    result_dict = cache.get_cached_data(
        use_cache, cache_only, cache_path, log_label, extract_function)

    if(analysis_object is None
       or result_dict is None):
        pass
    else:
        analysis_object.analyze(result_dict)

    if(result_dict is None
       or post_process_function is None):
        pass
    else:
        post_process_function(result_dict)

    return result_dict
