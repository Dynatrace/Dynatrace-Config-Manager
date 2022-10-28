from unittest import skip
import process_match_entities
import process_match_settings_2_0
import process_analyze_schemas
import credentials
import api_v2
import json
import ui_api_entity_config
from deepdiff import DeepDiff


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

    if(run_info['forced_match']):
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
    if(run_info['forced_match']):

        match_entities_function = process_match_entities.match_entities_forced_live

    matched_entities_dict = match_entities_function(
        run_info, analysis_filter, active_rules, context_params)

    return matched_entities_dict


def get_config_dict(run_info, analysis_filter):

    config_function = process_match_settings_2_0.match_config

    if(run_info['forced_match']):
        config_function = process_match_settings_2_0.match_config_forced_live

    all_tenant_config_dict = config_function(run_info, analysis_filter)

    return all_tenant_config_dict


def copy_configs_safe_same_entity_id(run_info, context_params, pre_migration, tenant_key_target,
                                     matched_entities_dict_compare, schemas_definitions_dict,
                                     config_dict_main, config_dict_target):

    same_entity_id_index_main_to_target = {}

    if(run_info['unique_entity']):
        same_entity_id_index_main_to_target = index_unique_entities(
            context_params)
    else:
        same_entity_id_index_main_to_target = index_matched_entities(
            matched_entities_dict_compare)

    config_main_only = {}
    config_target_only = {}
    config_both = {}

    for entity_id_main, entity_keys_target in same_entity_id_index_main_to_target.items():
        entity_type, entity_id_target = entity_keys_target

        (config_main_only, config_both) = compare_config(entity_type, schemas_definitions_dict,
                                                         config_dict_main, entity_id_main, config_main_only,
                                                         config_dict_target, entity_id_target, config_both)
        (config_target_only, _) = compare_config(entity_type, schemas_definitions_dict,
                                                 config_dict_target, entity_id_target, config_target_only,
                                                 config_dict_main, entity_id_main, {})

    if(pre_migration):
        pass
    else:

        api_config = credentials.get_api_call_credentials(tenant_key_target)

        run_on_all_configs(api_config, config_target_only, delete_config, {})
        run_on_all_configs(api_config, config_main_only, add_config, {})
        run_on_all_configs(api_config, config_both, update_config, {})

    result_table = format_all_to_table(
        config_target_only, config_main_only, config_both)

    return result_table


def format_all_to_table(config_target_only, config_main_only, config_both, result_table=None, error_entries=None):

    if(result_table is None):
        result_table = {'legend': {'actions': {
            'del': 'D', 'add': 'A', 'upd': 'U', 'identical': 'I',
            'multi_object': 'M', 'multi_ordered': 'O', 'scope_isn_t_entity': 'S'}}, 'entities': {}}

    #schema_dict = settings_2_0.extract_schemas(credentials.get_api_call_credentials())
    # for schema_dict in

    result_table = run_on_all_configs(
        'del', config_target_only, format_to_table, result_table, skip_errors=False)
    result_table = run_on_all_configs(
        'add', config_main_only, format_to_table, result_table, skip_errors=False)
    result_table = run_on_all_configs(
        'upd', config_both, format_to_table, result_table, skip_errors=False)

    return result_table


def flatten_results(result_table):

    for entity_type in result_table['entities'].keys():
        type_dict = result_table['entities'][entity_type]
        result_table['entities'][entity_type] = {
            'items': list(type_dict.values())}

    return result_table


def run_on_all_configs(extra_input, config_dict, action_function, in_out_item, skip_errors=True):
    for schema_config_dict in config_dict.values():
        for config_id, config_dict in schema_config_dict.items():

            if(config_dict['error'] == True
               and skip_errors):
                pass
            else:
                action_function(extra_input, config_id,
                                config_dict, in_out_item)

    return in_out_item


def format_to_table(action, config_id, config_dict, result_table):

    entity_id_dict = config_dict['entity_id_dict']

    entity_id_from = entity_id_dict['from']
    entity_id_to = entity_id_dict['to']

    if(action == 'del'):
        entity_id_from = entity_id_dict['to']
        entity_id_to = entity_id_dict['from']

    entity_type = config_dict['type']

    decorated_entity_type = entity_type
    if(config_dict['error'] == True):
        decorated_entity_type += ': ERRORS'

    schema_id = config_dict['schema_id']

    if(decorated_entity_type in result_table['entities']):
        pass
    else:
        result_table['entities'][decorated_entity_type] = {}
        result_table['legend'][decorated_entity_type] = {
            'id': 0, 'schemas': {}}

    if(schema_id in result_table['legend'][decorated_entity_type]['schemas']):
        pass
    else:
        result_table['legend'][decorated_entity_type]['schemas'][schema_id] = result_table['legend'][decorated_entity_type]['id']
        result_table['legend'][decorated_entity_type]['id'] += 1

    schema_key = result_table['legend'][decorated_entity_type]['schemas'][schema_id]

    if(entity_id_to in result_table['entities'][decorated_entity_type]):
        if(entity_id_from == result_table['entities'][decorated_entity_type][entity_id_to]['from']):
            pass
        else:
            print("ERROR: Multiple sources for a single entity??")
            return

    else:
        result_table['entities'][decorated_entity_type][entity_id_to] = {
            'to': entity_id_to, 'from': entity_id_from}

    action_label = ""

    if(config_dict['identical']):
        pass
    else:
        action_label = result_table['legend']['actions'][action]

    if('action' in config_dict):

        for action_val in config_dict['action']:
            if(action_label == ""):
                pass
            else:
                action_label += ','
            action_label += result_table['legend']['actions'][action_val]

    result_table['entities'][decorated_entity_type][entity_id_to][schema_key] = action_label


def delete_config(api_config, config_id, config_dict, _):
    print('\n', 'delete: ', config_id)
    url_trail = '/' + config_id
    response = api_v2.delete(
        api_config, api_v2.settings_objects, url_trail)

    print(response)


def add_config(api_config, config_id, config_dict, _):
    print('\n', 'add: ', config_id, config_dict)

    payload = gen_target_payload(config_dict, 'current')

    url_trail = ''

    response = api_v2.post(
        api_config, api_v2.settings_objects, url_trail, json.dumps([payload]))

    print(response)


def update_config(api_config, config_id, config_dict, _):

    print('\n', 'update: ', config_id, config_dict)

    if(config_dict['identical']):
        print("Is Identical, will not update")
        # return

    payload = gen_target_payload(config_dict, 'source')

    url_trail = '/' + config_dict['current']['objectId']

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


def compare_config(entity_type, schemas_definitions_dict,
                   config_dict_from, entity_id_from, config_from_only,
                   config_dict_to, entity_id_to, config_both):

    if(entity_type in config_dict_from['entity_config_index']):
        pass
    else:
        return (config_from_only, config_both)

    for schema_id, schema_dict_from in config_dict_from['entity_config_index'][entity_type].items():

        entity_in_from = False
        if(entity_id_from in schema_dict_from):
            entity_in_from = True

        entity_id_in_to = False
        schema_dict_to = None
        try:
            schema_dict_to = config_dict_to[
                'entity_config_index'][entity_type][schema_id]
            if(entity_id_to in schema_dict_to):
                entity_id_in_to = True
        except KeyError:
            pass

        if(entity_in_from):

            entity_id_dict = {'from': entity_id_from, 'to': entity_id_to}

            error_id = None

            if(schema_id in schemas_definitions_dict['ordered_schemas']):
                error_id = 'multi_ordered'

            elif(schema_id in schemas_definitions_dict['multi_object_schemas']):
                error_id = 'multi_object'

            if(entity_id_in_to):
                config_both = create_update_configs(config_both, entity_type, schema_id, entity_id_dict, error_id,
                                                    config_dict_from, schema_dict_from, entity_id_from,
                                                    config_dict_to, schema_dict_to, entity_id_to)
            else:
                config_from_only = add_configs(config_from_only, entity_type, schema_id, 'current', schema_dict_from[entity_id_from][0],
                                               schema_dict_from[entity_id_from], config_dict_from, entity_id_dict, error_id=error_id)

    return (config_from_only, config_both)


def create_update_configs(config_both, entity_type, schema_id, entity_id_dict, error_id,
                          config_dict_from, schema_dict_from, entity_id_from,
                          config_dict_to, schema_dict_to, entity_id_to):

    config_list_from = schema_dict_from[entity_id_from]
    config_list_to = schema_dict_to[entity_id_to]

    source_config_id = config_list_from[0]
    current_config_id = config_list_to[0]

    ddiff = DeepDiff(config_dict_to['configs'][current_config_id]['value'],
                     config_dict_from['configs'][source_config_id]['value'],
                     ignore_order=True)

    identical = True
    if(len(ddiff) > 0):
        identical = False

    config_both = add_configs(config_both, entity_type, schema_id, 'current', current_config_id,
                              config_list_to, config_dict_to, entity_id_dict, identical, error_id)
    config_both = add_configs(config_both, entity_type, schema_id, 'source', current_config_id,
                              config_list_from, config_dict_from, identical=identical, error_id=error_id)

    return config_both


def add_configs(config_dict, entity_type, schema_id, config_tenant_type, current_config_id,
                config_list, tenant_config_dict, entity_id_dict=None, identical=False, error_id=None):

    if(schema_id in config_dict):
        pass
    else:
        config_dict[schema_id] = {}

    if(current_config_id in config_dict[schema_id]):
        pass
    else:
        config_dict[schema_id][current_config_id] = {}
        config_dict[schema_id][current_config_id]['action'] = []
        config_dict[schema_id][current_config_id]['error'] = False

    object_id = config_list[0]

    config_dict[schema_id][current_config_id][config_tenant_type] = tenant_config_dict['configs'][object_id]

    if(entity_id_dict is None):
        pass
    else:
        config_dict[schema_id][current_config_id]['entity_id_dict'] = entity_id_dict

    config_dict[schema_id][current_config_id]['identical'] = identical
    if(identical == True):
        config_dict[schema_id][current_config_id]['action'] = add_action_to_list(
            config_dict[schema_id][current_config_id]['action'], 'identical')
        

    config_dict[schema_id][current_config_id]['type'] = entity_type
    config_dict[schema_id][current_config_id]['schema_id'] = schema_id

    if(entity_id_dict is not None
       and 'scope' in tenant_config_dict['configs'][object_id]):
        #print(tenant_config_dict['configs'][object_id], entity_id_dict)
        # TODO: Deal with multi config per entity & multi entity per config

        if(tenant_config_dict['configs'][object_id]['scope'] == entity_id_dict['from']
           or tenant_config_dict['configs'][object_id]['scope'] == entity_id_dict['to']):
            pass
        else:
            config_dict[schema_id][current_config_id]['error'] = True
            config_dict[schema_id][current_config_id]['action'] = add_action_to_list(
                config_dict[schema_id][current_config_id]['action'], 'scope_isn_t_entity')

            print("ERROR: Scope isn't the entity: ", tenant_config_dict['configs'][object_id]
                  ['scope'], tenant_config_dict['configs'][object_id]['schemaId'], error_id)
            #print('\n', tenant_config_dict['configs'][object_id])

    if(error_id is None):
        pass
    else:
        config_dict[schema_id][current_config_id]['error'] = True
        config_dict[schema_id][current_config_id]['action'] = add_action_to_list(
            config_dict[schema_id][current_config_id]['action'], error_id)

    if(len(config_list) > 1):
        print(
            "TODO: Deal with multi config per entity & multi entity per config",
            "\n", schema_id, config_list, entity_id_dict)

    return config_dict


def add_action_to_list(action_list, action):
    if(action in action_list):
        pass
    else:
        action_list.append(action)

    return action_list


def index_matched_entities(matched_entities_dict_compare):

    same_entity_id_index = {}

    for entity_type in matched_entities_dict_compare.keys():

        for entity_id_target in matched_entities_dict_compare[entity_type].keys():

            for matched_entity_id in matched_entities_dict_compare[entity_type][entity_id_target]['match_entity_list'].keys():

                if('same_entity_id' in matched_entities_dict_compare[entity_type][entity_id_target]['match_entity_list'][matched_entity_id]
                   or 'forced_match' in matched_entities_dict_compare[entity_type][entity_id_target]['match_entity_list'][matched_entity_id]):

                    # TODO Add code to resolve multiple entities matching each other
                    if(matched_entity_id in same_entity_id_index):
                        print("TODO: Manage Override!!!", matched_entity_id, same_entity_id_index[matched_entity_id], (
                            entity_type, entity_id_target))

                    same_entity_id_index[matched_entity_id] = (
                        entity_type, entity_id_target)

    return same_entity_id_index


def index_unique_entities(context_params):

    same_entity_id_index = {}

    for entity_id_target, entity_id_main in context_params['provided_id'].items():

        if(entity_id_main == entity_id_target):

            same_entity_id_index[entity_id_main] = (
                entity_id_target, entity_id_target)

        else:

            print("ERROR: Unique Entity IDs should be identical on both sides")

    return same_entity_id_index
