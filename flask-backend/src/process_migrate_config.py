from unittest import skip
import compare
import process_match_entities
import process_match_settings_2_0
import process_analyze_schemas
import process_utils
import credentials
import api_v2
import json
import ui_api_entity_config

ACTION_ADD = 'Add'
ACTION_DELETE = 'Delete'
ACTION_UPDATE = 'Update'
ACTION_IDENTICAL = 'Identical'


def migrate_config(run_info, tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params, pre_migration=True):

    schemas_definitions_dict = get_schemas_definitions_dict(
        run_info, analysis_filter)

    matched_entities_dict = get_entities_dict(
        run_info, analysis_filter, active_rules, context_params)

    all_tenant_config_dict = get_config_dict(
        run_info, analysis_filter)

    result_table = copy_configs_safe_same_entity_id(
        run_info, context_params, pre_migration, tenant_key_target,
        matched_entities_dict, schemas_definitions_dict[tenant_key_main],
        all_tenant_config_dict[tenant_key_main], all_tenant_config_dict[tenant_key_target])

    if (run_info['forced_match']):
        result_table = ui_api_entity_config.copy_entity(
            run_info, result_table, pre_migration)

    flat_result_table = flatten_results(result_table)

    return flat_result_table


def get_schemas_definitions_dict(run_info, analysis_filter):
    schemas_definitions_dict = process_analyze_schemas.analyze_schemas(
        run_info, analysis_filter)

    return schemas_definitions_dict


def get_entities_dict(run_info, analysis_filter, active_rules, context_params):

    match_entities_function = process_match_entities.match_entities

    if (run_info['forced_match']):

        match_entities_function = process_match_entities.match_entities_forced_live

    matched_entities_dict = match_entities_function(
        run_info, analysis_filter, active_rules, context_params)

    return matched_entities_dict


def get_config_dict(run_info, analysis_filter):

    config_function = process_match_settings_2_0.match_config

    if (run_info['forced_match']):
        config_function = process_match_settings_2_0.match_config_forced_live

    all_tenant_config_dict = config_function(run_info, analysis_filter)

    return all_tenant_config_dict


def copy_configs_safe_same_entity_id(run_info, context_params, pre_migration, tenant_key_target,
                                     matched_entities_dict_compare, schemas_definitions_dict,
                                     config_dict_main, config_dict_target):

    same_entity_id_index_main_to_target = {}

    if (run_info['unique_entity']):
        same_entity_id_index_main_to_target = index_unique_entities(
            context_params)
    else:
        same_entity_id_index_main_to_target = index_matched_entities(
            matched_entities_dict_compare)

    compare_config_dict = {}

    for entity_id_main, entity_keys_target in same_entity_id_index_main_to_target.items():
        entity_type, entity_id_target = entity_keys_target

        compare_config_dict = compare_config(entity_type, schemas_definitions_dict, compare_config_dict,
                                             config_dict_main, entity_id_main,
                                             config_dict_target, entity_id_target)

    execute_all_configs(tenant_key_target, compare_config_dict, pre_migration)

    result_table = format_all_to_table(compare_config_dict)

    return result_table


def execute_all_configs(tenant_key_target, config_dict, pre_migration):

    action_function_map = {
        ACTION_ADD: add_config,
        ACTION_DELETE: delete_config,
        ACTION_UPDATE: update_config,
    }

    api_config = credentials.get_api_call_credentials(tenant_key_target)

    for schema_config_dict in config_dict.values():
        for config_id, config_dict in schema_config_dict.items():

            if (config_dict['error'] == True):
                pass
            else:
                action = config_dict['action']

                if (action in action_function_map):
                    action_function = action_function_map[action]
                    action_function(api_config, config_id,
                                    config_dict, pre_migration)


def format_all_to_table(compare_config_dict, result_table=None):

    if (result_table is None):
        result_table = {'legend': {'status': {
            ACTION_DELETE: 'D', ACTION_ADD: 'A', ACTION_UPDATE: 'U', ACTION_IDENTICAL: 'I',
            'multi_object': 'M', 'multi_ordered': 'O', 'scope_isn_t_entity': 'S'}}, 'entities': {}}

    result_table = format_all_configs(compare_config_dict, result_table)

    return result_table


def flatten_results(result_table):

    if ('entities' in result_table):
        for entity_type in result_table['entities'].keys():
            type_dict = result_table['entities'][entity_type]
            result_table['entities'][entity_type] = {
                'items': list(type_dict.values())}

    return result_table


def format_all_configs(config_dict, result_table):
    for schema_config_dict in config_dict.values():
        for config_dict in schema_config_dict.values():

            result_table = format_to_table(config_dict, result_table)

    return result_table


def format_to_table(config_dict, result_table):

    entity_id_dict = config_dict['entity_id_dict']

    entity_id_main = entity_id_dict['from']
    entity_id_target = entity_id_dict['to']

    action = config_dict['action']

    entity_type = config_dict['type']

    decorated_entity_type = entity_type
    if (config_dict['error'] == True):
        decorated_entity_type += ': ERRORS'

    schema_id = config_dict['schema_id']

    is_unique_entity = False
    row_key = entity_id_target

    if (entity_id_target in process_utils.UNIQUE_ENTITY_LIST):
        is_unique_entity = True
        row_key = entity_id_target + "_" + schema_id

    if (decorated_entity_type in result_table['entities']):
        pass
    else:
        result_table['entities'][decorated_entity_type] = {}
        if (is_unique_entity):
            pass
        else:
            result_table['legend'][decorated_entity_type] = {
                'id': 0, 'schemas': {}}

    if (row_key in result_table['entities'][decorated_entity_type]):
        if (entity_id_main == result_table['entities'][decorated_entity_type][row_key]['from']):
            pass
        else:
            print("ERROR: Multiple sources for a single entity??")
            return

    else:
        if (is_unique_entity):
            result_table['entities'][decorated_entity_type][row_key] = {
                'scope': entity_id_target, 'schemaId': schema_id}
        else:
            result_table['entities'][decorated_entity_type][row_key] = {
                'to': entity_id_target, 'from': entity_id_main}

    status_label = ""

    if (config_dict['identical']):
        pass
    else:
        status_label = result_table['legend']['status'][action]

    if ('status' in config_dict):

        for status_val in config_dict['status']:
            if (status_label == ""):
                pass
            else:
                status_label += ','
            status_label += result_table['legend']['status'][status_val]

    result_table['entities'][decorated_entity_type][row_key]['unique'] = is_unique_entity

    if (is_unique_entity):
        result_table['entities'][decorated_entity_type][row_key]['status'] = status_label
        if ('main' in config_dict):
            result_table['entities'][decorated_entity_type][row_key]['data_main'] = json.dumps(
                config_dict['main'])
        if ('target' in config_dict):
            result_table['entities'][decorated_entity_type][row_key]['data_target'] = json.dumps(
                config_dict['target'])
    else:

        if (schema_id in result_table['legend'][decorated_entity_type]['schemas']):
            pass
        else:
            result_table['legend'][decorated_entity_type]['schemas'][schema_id] = result_table['legend'][decorated_entity_type]['id']
            result_table['legend'][decorated_entity_type]['id'] += 1

        schema_key = result_table['legend'][decorated_entity_type]['schemas'][schema_id]
        result_table['entities'][decorated_entity_type][row_key][schema_key] = status_label

        if('data' in result_table['entities'][decorated_entity_type][row_key]):
            pass
        else:
            result_table['entities'][decorated_entity_type][row_key]['data'] = {}
            
        if(schema_key in result_table['entities'][decorated_entity_type][row_key]['data']):
            pass
        else:
            result_table['entities'][decorated_entity_type][row_key]['data'][schema_key] = {}

        if ('main' in config_dict):
            result_table['entities'][decorated_entity_type][row_key]['data'][schema_key]['data_main'] = json.dumps(
                config_dict['main'])
        if ('target' in config_dict):
            result_table['entities'][decorated_entity_type][row_key]['data'][schema_key]['data_target'] = json.dumps(
                config_dict['target'])

    return result_table


def add_error_message(result_table, message):
    if (result_table is None):
        result_table = {}

    if ('errors' in result_table):
        pass
    else:
        result_table['errors'] = []

    result_table['errors'].append(message)

    return result_table


def delete_config(api_config, config_id, config_dict, pre_migration):
    print('\n', 'delete: ', config_id)
    url_trail = '/' + config_id

    if (pre_migration):
        pass
    else:
        response = api_v2.delete(
            api_config, api_v2.settings_objects, url_trail)

        print(response)


def add_config(api_config, config_id, config_dict, pre_migration):

    payload = gen_target_payload(config_dict, 'main')

    url_trail = ''

    print('\n', 'add: ', config_id, payload)

    if (pre_migration):
        pass
    else:
        response = api_v2.post(
            api_config, api_v2.settings_objects, url_trail, json.dumps([payload]))

        print(response)


def update_config(api_config, config_id, config_dict, pre_migration):

    payload = gen_target_payload(config_dict, 'main')

    url_trail = '/' + config_dict['target']['objectId']

    print('\n', 'update: ', url_trail, config_id, payload)

    if (pre_migration):
        pass
    else:
        response = api_v2.put(
            api_config, api_v2.settings_objects, url_trail, json.dumps(payload))

        print(response)


def gen_target_payload(config_dict, config_tenant_type):

    config_dict_replaced = replace_entities(config_dict, config_tenant_type)
    payload = {"schemaId": config_dict[config_tenant_type]["schemaId"],
               "scope": config_dict_replaced["scope"], "value": config_dict_replaced["value"]}

    return payload


def replace_entities(config_dict, config_tenant_type):

    entity_id_dict = config_dict['entity_id_dict']

    config_dict_target = config_dict[config_tenant_type]
    config_str = json.dumps(config_dict_target)
    config_str_replaced = config_str.replace(
        entity_id_dict['from'], entity_id_dict['to'])
    config_dict_replaced = json.loads(config_str_replaced)

    return config_dict_replaced


def get_sorted_schema_list(entity_type, config_dict):
    if (entity_type in config_dict['entity_config_index']):
        schema_list = list(
            config_dict['entity_config_index'][entity_type].keys())
        schema_list.sort()
        return schema_list
    else:
        return []


def get_all_sorted_schema_merged_list(entity_type, config_dict_main, config_dict_target):
    schema_list_main = get_sorted_schema_list(entity_type, config_dict_main)
    schema_list_target = get_sorted_schema_list(
        entity_type, config_dict_target)

    all_sorted_schema_list = compare.merge_lists(
        schema_list_main, schema_list_target)

    return all_sorted_schema_list


def extract_validation_info(schema_id, config_dict, entity_type, entity_id):

    entity_id_in = False
    schema_dict = None
    try:
        schema_dict = config_dict[
            'entity_config_index'][entity_type][schema_id]
        if (entity_id in schema_dict):
            entity_id_in = True
    except KeyError:
        pass

    return entity_id_in, schema_dict


def compare_config(entity_type, schemas_definitions_dict, compare_config_dict,
                   config_dict_main, entity_id_main,
                   config_dict_target, entity_id_target):

    all_sorted_schema_list = get_all_sorted_schema_merged_list(
        entity_type, config_dict_main, config_dict_target)

    for schema_id in all_sorted_schema_list:

        is_entity_id_in_main, schema_dict_main = extract_validation_info(
            schema_id, config_dict_main, entity_type, entity_id_main)
        is_entity_id_in_target, schema_dict_target = extract_validation_info(
            schema_id, config_dict_target, entity_type, entity_id_target)

        entity_id_dict = {'from': entity_id_main, 'to': entity_id_target}

        error_id = None

        if (schema_id in schemas_definitions_dict['ordered_schemas']):
            error_id = 'multi_ordered'

        elif (schema_id in schemas_definitions_dict['multi_object_schemas']):
            error_id = 'multi_object'

        if (is_entity_id_in_main
           and is_entity_id_in_target):

            compare_config_dict = create_update_configs(compare_config_dict, entity_type, schema_id, entity_id_dict, error_id,
                                                        config_dict_main, schema_dict_main, entity_id_main,
                                                        config_dict_target, schema_dict_target, entity_id_target)
        elif (is_entity_id_in_target):

            compare_config_dict = add_configs(compare_config_dict, ACTION_DELETE, entity_type, schema_id, 'target', schema_dict_target[entity_id_target][0],
                                              schema_dict_target[entity_id_target], config_dict_target, entity_id_dict, error_id=error_id)

        elif (is_entity_id_in_main):

            compare_config_dict = add_configs(compare_config_dict, ACTION_ADD, entity_type, schema_id, 'main', schema_dict_main[entity_id_main][0],
                                              schema_dict_main[entity_id_main], config_dict_main, entity_id_dict, error_id=error_id)

    return compare_config_dict


def create_update_configs(compare_config_dict, entity_type, schema_id, entity_id_dict, error_id,
                          config_dict_main, schema_dict_main, entity_id_main,
                          config_dict_target, schema_dict_target, entity_id_target):

    config_list_main = schema_dict_main[entity_id_main]
    config_list_target = schema_dict_target[entity_id_target]

    main_config_id = config_list_target[0]
    target_config_id = config_list_main[0]

    is_deeply_different = compare.is_deeply_different(
        config_dict_target['configs'][main_config_id]['value'],
        config_dict_main['configs'][target_config_id]['value'])

    identical = True
    action = ACTION_IDENTICAL
    if (is_deeply_different):
        identical = False
        action = ACTION_UPDATE

    compare_config_dict = add_configs(compare_config_dict, action, entity_type, schema_id, 'target', target_config_id,
                                      config_list_target, config_dict_target, entity_id_dict, identical, error_id)
    compare_config_dict = add_configs(compare_config_dict, action, entity_type, schema_id, 'main', target_config_id,
                                      config_list_main, config_dict_main, identical=identical, error_id=error_id)

    return compare_config_dict


def add_configs(config_dict, action, entity_type, schema_id, config_tenant_type, current_config_id,
                config_list, tenant_config_dict, entity_id_dict=None, identical=False, error_id=None):

    if (schema_id in config_dict):
        pass
    else:
        config_dict[schema_id] = {}

    if (current_config_id in config_dict[schema_id]):
        pass
    else:
        config_dict[schema_id][current_config_id] = {
            'status': [], 'error': False, 'action': action}

    object_id = config_list[0]
    config_dict[schema_id][current_config_id][config_tenant_type] = tenant_config_dict['configs'][object_id]

    if (entity_id_dict is None):
        pass
    else:
        config_dict[schema_id][current_config_id]['entity_id_dict'] = entity_id_dict

    config_dict[schema_id][current_config_id]['identical'] = identical
    if (identical == True):
        config_dict[schema_id][current_config_id]['status'] = add_status_to_list(
            config_dict[schema_id][current_config_id]['status'], ACTION_IDENTICAL)

    config_dict[schema_id][current_config_id]['type'] = entity_type
    config_dict[schema_id][current_config_id]['schema_id'] = schema_id

    if (entity_id_dict is not None
       and 'scope' in tenant_config_dict['configs'][object_id]):
        #print(tenant_config_dict['configs'][object_id], entity_id_dict)
        # TODO: Deal with multi config per entity & multi entity per config

        if (tenant_config_dict['configs'][object_id]['scope'] == entity_id_dict['from']
           or tenant_config_dict['configs'][object_id]['scope'] == entity_id_dict['to']):
            pass
        else:
            config_dict[schema_id][current_config_id]['error'] = True
            config_dict[schema_id][current_config_id]['status'] = add_status_to_list(
                config_dict[schema_id][current_config_id]['status'], 'scope_isn_t_entity')

            print("ERROR: Scope isn't the entity: ", tenant_config_dict['configs'][object_id]
                  ['scope'], tenant_config_dict['configs'][object_id]['schemaId'], error_id)
            #print('\n', tenant_config_dict['configs'][object_id])

    if (error_id is None):
        pass
    else:
        config_dict[schema_id][current_config_id]['error'] = True
        config_dict[schema_id][current_config_id]['status'] = add_status_to_list(
            config_dict[schema_id][current_config_id]['status'], error_id)

    if (len(config_list) > 1):
        print(
            "TODO: Deal with multi config per entity & multi entity per config",
            "\n", schema_id, config_list, entity_id_dict)

    return config_dict


def add_status_to_list(status_list, status):
    if (status in status_list):
        pass
    else:
        status_list.append(status)

    return status_list


def index_matched_entities(matched_entities_dict_compare):

    same_entity_id_index = {}

    for entity_type in matched_entities_dict_compare.keys():

        for entity_id_target in matched_entities_dict_compare[entity_type].keys():

            for matched_entity_id in matched_entities_dict_compare[entity_type][entity_id_target]['match_entity_list'].keys():

                if ('same_entity_id' in matched_entities_dict_compare[entity_type][entity_id_target]['match_entity_list'][matched_entity_id]
                   or 'forced_match' in matched_entities_dict_compare[entity_type][entity_id_target]['match_entity_list'][matched_entity_id]):

                    # TODO Add code to resolve multiple entities matching each other
                    if (matched_entity_id in same_entity_id_index):
                        print("TODO: Manage Override!!!", matched_entity_id, same_entity_id_index[matched_entity_id], (
                            entity_type, entity_id_target))

                    same_entity_id_index[matched_entity_id] = (
                        entity_type, entity_id_target)

    return same_entity_id_index


def index_unique_entities(context_params):

    same_entity_id_index = {}

    for entity_id_target, entity_id_main in context_params['provided_id'].items():

        if (entity_id_main == entity_id_target):

            same_entity_id_index[entity_id_main] = (
                entity_id_target, entity_id_target)

        else:

            print("ERROR: Unique Entity IDs should be identical on both sides")

    return same_entity_id_index
