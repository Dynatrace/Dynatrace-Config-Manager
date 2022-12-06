import dirs
import credentials
import ui_api
import cache
import compare
import json
import entity_utils
import process_migrate_config
import copy
import requests

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


def copy_entity_standalone(run_info,  pre_migration=True):

    result_table = None

    result_table = copy_entity(
        run_info, result_table=None, pre_migration=pre_migration)

    flat_result_table = process_migrate_config.flatten_results(result_table)

    return flat_result_table


def copy_entity(run_info, result_table=None, pre_migration=True):

    try:
        result_table = do_copy_entity(run_info, result_table, pre_migration)
    except requests.exceptions.HTTPError as err:
        result_table = gen_http_error_message(result_table, err)

    return result_table


def gen_http_error_message(result_table, err):

    message = ''

    if (err.response.status_code == 401):
        message = "Request Headers for UIApi calls are not valid or expired: "
    else:
        message = "UIApi Request failed with an unexpected code: "

    message += '\n'
    message += 'Error message: '
    message += str(err)
    result_table = process_migrate_config.add_error_message(
        result_table, message)

    return result_table


def do_copy_entity(run_info, result_table=None, pre_migration=True):
    use_cache = False
    cache_only = False
    tenant_key_main = run_info['tenant_key_main']
    tenant_key_target = run_info['tenant_key_target']

    all_tenant_entity_values = {}

    for tenant_dict in run_info['tenant_param_dict'].values():

        tenant_key = tenant_dict['tenant_key']

        if (tenant_key in all_tenant_entity_values):
            pass
        else:
            entity = get_entity(
                tenant_key, tenant_dict['scope'], use_cache, cache_only)

            if (entity is None):
                return result_table
            else:
                all_tenant_entity_values[tenant_key] = get_entity(
                    tenant_key, tenant_dict['scope'], use_cache, cache_only)

    compare_config_dict = {}

    entity_id_main = all_tenant_entity_values[tenant_key_main]['entity_id']
    entity_id_target = all_tenant_entity_values[tenant_key_target]['entity_id']
    entity_id_dict = {'from': entity_id_main, 'to': entity_id_target}
    entity_type = entity_utils.extract_type_from_entity_id(entity_id_target)

    updated_entity_data = copy.deepcopy(
        all_tenant_entity_values[tenant_key_main]['data'])

    settings_key = entity_copy_configs[entity_type]['settings_key']
    for copy_property, default_value in entity_copy_configs[entity_type]['settings_and_default_value'].items():
        is_in_main = False

        if (copy_property in all_tenant_entity_values[tenant_key_main]['data'][settings_key]):
            is_in_main = True

        is_in_target = False
        if (copy_property in all_tenant_entity_values[tenant_key_target]['data'][settings_key]):
            is_in_target = True

        if (is_in_main
           and is_in_target):

            is_deeply_different = compare.is_deeply_different(
                all_tenant_entity_values[tenant_key_target]['data'][settings_key][copy_property],
                all_tenant_entity_values[tenant_key_main]['data'][settings_key][copy_property])

            identical = True
            action = process_migrate_config.ACTION_IDENTICAL
            if (is_deeply_different):
                identical = False
                action = process_migrate_config.ACTION_UPDATE

            tenant_config_dict = create_tenant_config_dict(
                entity_id_target, all_tenant_entity_values, tenant_key_target, settings_key, copy_property)
            compare_config_dict = process_migrate_config.add_configs(compare_config_dict, action, entity_type, copy_property, '', 'target', entity_id_target,
                                                                     [entity_id_target], tenant_config_dict, entity_id_dict, identical)

            tenant_config_dict = create_tenant_config_dict(
                entity_id_main, all_tenant_entity_values, tenant_key_main, settings_key, copy_property)
            compare_config_dict = process_migrate_config.add_configs(compare_config_dict, action, entity_type, copy_property, '', 'main', entity_id_main,
                                                                     [entity_id_main], tenant_config_dict, entity_id_dict, identical)

        elif (is_in_main):

            tenant_config_dict = create_tenant_config_dict(
                entity_id_main, all_tenant_entity_values, tenant_key_main, settings_key, copy_property)
            compare_config_dict = process_migrate_config.add_configs(compare_config_dict, process_migrate_config.ACTION_ADD, entity_type, copy_property, '', 'main', entity_id_main,
                                                                     [entity_id_main], tenant_config_dict, entity_id_dict)

            updated_entity_data[settings_key][
                copy_property] = all_tenant_entity_values[tenant_key_main]['data'][settings_key][copy_property]

        elif (is_in_target):

            is_deeply_different = compare.is_deeply_different(
                default_value,
                all_tenant_entity_values[tenant_key_target]['data'][settings_key][copy_property])

            if (is_deeply_different):
                tenant_config_dict = create_tenant_config_dict(
                    entity_id_target, all_tenant_entity_values, tenant_key_target, settings_key, copy_property)
                compare_config_dict = process_migrate_config.add_configs(compare_config_dict, process_migrate_config.ACTION_DELETE, entity_type, copy_property, '', 'target', entity_id_target,
                                                                         [entity_id_target], tenant_config_dict, entity_id_dict)

                updated_entity_data[settings_key][copy_property] = default_value

    if (pre_migration == True):
        pass
    else:
        update_response = update_entity(
            tenant_key_target, all_tenant_entity_values[tenant_key_target]['entity_id'], updated_entity_data)
        print(update_response)

    result_table = process_migrate_config.format_all_to_table(
        compare_config_dict, result_table)

    return result_table


def create_tenant_config_dict(entity_id, all_tenant_entity_values, tenant_key, settings_key, copy_property):
    # TODO: We should validate multi_matched_objects and management_zone_objects for UI API, but no impact for Web Request Naming

    return {
        'multi_matched_objects': {},
        'management_zone_objects': {},
        'configs': {
            entity_id: all_tenant_entity_values[tenant_key]['data'][settings_key][copy_property]
        }
    }


def get_entity(tenant_key, entity_id, use_cache, cache_only):

    entity_type = entity_utils.extract_type_from_entity_id(entity_id)

    if (entity_type in entity_copy_configs):
        pass
    else:
        print("type:", entity_type, "Not part of UIAPI")
        return None

    config = credentials.get_ui_api_call_credentials(tenant_key)
    label = 'ui_api'
    log_label = label + '/' + entity_type + '_' + entity_id

    cache_path = dirs.get_tenant_data_cache_sub_dir(config, label)
    cache_path = dirs.get_file_path(cache_path, entity_id)

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
    print(json.dumps(payload))

    return ui_api.put(
        config, ui_api.entity_details, url_trail, json.dumps(payload))


def get_entity_url_trail(type, entity_id):
    url_trail = '/' + type
    url_trail += '/' + entity_id

    return url_trail
