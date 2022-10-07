import dirs
import credentials
import ui_api
import cache
import json
import entity_utils
import process_utils
import process_migrate_config
import copy
from deepdiff import DeepDiff


def copy_entity_standalone(tenant_key_main, tenant_key_target, context_params, pre_migration=True):

    result_table = copy_entity(tenant_key_main, tenant_key_target,
                               context_params, result_table=None, pre_migration=pre_migration)

    flat_result_table = process_migrate_config.flatten_results(result_table)

    return flat_result_table


def copy_entity(tenant_key_main, tenant_key_target, context_params, result_table=None, pre_migration=True):
    use_cache = False
    cache_only = False

    run_info = process_utils.get_run_info(
        tenant_key_main, tenant_key_target, context_params)

    all_tenant_entity_values = {}

    for tenant_dict in run_info['tenant_dict_list']:

        tenant_key = tenant_dict['tenant_key']

        if(tenant_key in all_tenant_entity_values):
            pass
        else:
            all_tenant_entity_values[tenant_key] = get_entity(
                tenant_key, tenant_dict['scope'], use_cache, cache_only)

    entity_copy_configs = {'SERVICE':
                           {'update_type': 'bundled',
                            'settings_key': 'serviceSettings',
                            'settings_and_default_value':
                            {'binaryExtensions': ".exe, .zip",
                             'imageExtensions': ".jpg, .png, .gif, .jpeg, .bmp, .svg, .ico, .woff, .ttf, .otf, .woff2, .eot, .dtdtdtdt",
                             'serviceMethodNamingRuleList': [],
                             'webRequestNamingByCleanupList': []}
                            }
                           }

    config_main_only = {}
    config_target_only = {}
    config_both = {}
    entity_id_main = all_tenant_entity_values[tenant_key_main]['entity_id']
    entity_id_target = all_tenant_entity_values[tenant_key_target]['entity_id']
    entity_id_dict = {'from': entity_id_main, 'to': entity_id_target}
    entity_id_dict_inverted = {'to': entity_id_main, 'from': entity_id_target}
    entity_type = entity_utils.extract_type_from_entity_id(entity_id_target)

    updated_entity_data = copy.deepcopy(
        all_tenant_entity_values[tenant_key_main]['data'])

    settings_key = entity_copy_configs[entity_type]['settings_key']
    for copy_property, default_value in entity_copy_configs[entity_type]['settings_and_default_value'].items():
        is_in_main = False
        print(all_tenant_entity_values[tenant_key_main]['data'])
        if(copy_property in all_tenant_entity_values[tenant_key_main]['data'][settings_key]):
            is_in_main = True

        is_in_target = False
        if(copy_property in all_tenant_entity_values[tenant_key_target]['data'][settings_key]):
            is_in_target = True

        if(is_in_main == True):

            if(is_in_target == True):
                ddiff = DeepDiff(all_tenant_entity_values[tenant_key_target]['data'][settings_key][copy_property],
                                 all_tenant_entity_values[tenant_key_main]['data'][settings_key][copy_property],
                                 ignore_order=True)

                identical = True
                if(len(ddiff) > 0):
                    identical = False

                config_both = process_migrate_config.add_configs(config_both, entity_type, copy_property, 'current', entity_id_target,
                                                                 [entity_id_target], {'configs': {
                                                                     entity_id_target: all_tenant_entity_values[tenant_key_target]['data'][settings_key][copy_property]}},
                                                                 entity_id_dict, identical)
                config_both = process_migrate_config.add_configs(config_both, entity_type, copy_property, 'source', entity_id_main,
                                                                 [entity_id_main], {'configs': {
                                                                     entity_id_main: all_tenant_entity_values[tenant_key_main]['data'][settings_key][copy_property]}},
                                                                 entity_id_dict, identical)
            else:
                config_main_only = process_migrate_config.add_configs(config_main_only, entity_type, copy_property, 'current', entity_id_main,
                                                                      [entity_id_main], {'configs': {
                                                                          entity_id_main: all_tenant_entity_values[tenant_key_main]['data'][settings_key][copy_property]}},
                                                                      entity_id_dict)

            updated_entity_data[settings_key][
                copy_property] = all_tenant_entity_values[tenant_key_main]['data'][settings_key][copy_property]

        else:

            if(is_in_target == True):

                ddiff = DeepDiff(default_value,
                                 all_tenant_entity_values[tenant_key_target]['data'][settings_key][copy_property],
                                 ignore_order=True)

                if(len(ddiff) > 0):
                    config_target_only = process_migrate_config.add_configs(config_target_only, entity_type, copy_property, 'current', entity_id_target,
                                                                            [entity_id_target], {'configs': {
                                                                                entity_id_target: all_tenant_entity_values[tenant_key_target]['data'][settings_key][copy_property]}},
                                                                            entity_id_dict_inverted)

                    updated_entity_data[settings_key][copy_property] = default_value

    if(pre_migration == True):
        pass
    else:
        update_response = update_entity(
            tenant_key_target, all_tenant_entity_values[tenant_key_target]['entity_id'], updated_entity_data)
        print(update_response)

    print(config_main_only)
    result_table = process_migrate_config.format_all_to_table(
        config_target_only, config_main_only, config_both, result_table)
    print(result_table)

    return result_table

#def update_bundle():
    

def get_entity(tenant_key, entity_id, use_cache, cache_only):

    entity_type = entity_utils.extract_type_from_entity_id(entity_id)

    config = credentials.get_ui_api_call_credentials(tenant_key)
    label = 'ui_api'
    filename = entity_type + '_' + entity_id
    log_label = label + '/' + filename

    cache_path = dirs.get_tenant_data_cache_sub_dir(config, label)
    cache_path += '/' + filename + '.json'

    def extract_function():
        url_trail = get_entity_url_trail(entity_type, entity_id)

        return ui_api.get_json(
            config, ui_api.entity_details, url_trail)

    data = cache.get_cached_data(
        use_cache, cache_only, cache_path, log_label, extract_function)

    if (data is None):
        return None

    return {"entity_id": entity_id, "data": data}


def update_entity(tenant_key, entity_id, payload):

    entity_type = entity_utils.extract_type_from_entity_id(entity_id)

    config = credentials.get_ui_api_call_credentials(tenant_key)

    url_trail = get_entity_url_trail(entity_type, entity_id)
    print('updating entity')

    print(type(payload), payload)
    print(json.dumps(payload))

    return ui_api.put(
        config, ui_api.entity_details, url_trail, json.dumps(payload))


def get_entity_url_trail(type, entity_id):
    url_trail = '/' + type
    url_trail += '/' + entity_id

    return url_trail
