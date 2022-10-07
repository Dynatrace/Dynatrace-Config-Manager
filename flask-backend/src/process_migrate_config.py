import process_match_entities
import process_match_config
import credentials
import api_v2
import json
import ui_api_entity_config
from deepdiff import DeepDiff


def migrate_config(tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params, pre_migration=True):

    matched_entities_dict = get_entities_dict(
        tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params)

    all_tenant_config_dict = get_config_dict(
        tenant_key_main, tenant_key_target, analysis_filter, context_params)

    result_table = copy_configs_safe_same_entity_id(pre_migration, tenant_key_target,
                                                    matched_entities_dict,
                                                    all_tenant_config_dict[tenant_key_main], all_tenant_config_dict[tenant_key_target])

    if(context_params is not None
       and 'provided_id' in context_params):
        result_table = ui_api_entity_config.copy_entity(
            tenant_key_main, tenant_key_target, context_params, result_table, pre_migration)

    flat_result_table = flatten_results(result_table)

    return flat_result_table


def get_entities_dict(tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params):

    match_entities_function = process_match_entities.match_entities
    if(context_params is not None
       and 'provided_id' in context_params):

        match_entities_function = process_match_entities.match_entities_forced_live

    matched_entities_dict = match_entities_function(
        tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params)

    return matched_entities_dict


def get_config_dict(tenant_key_main, tenant_key_target, analysis_filter, context_params):

    config_function = process_match_config.match_config

    if(context_params is not None
       and 'provided_id' in context_params):
        config_function = process_match_config.match_config_forced_live

    all_tenant_config_dict = config_function(
        tenant_key_main, tenant_key_target, analysis_filter, context_params)

    return all_tenant_config_dict


def copy_configs_safe_same_entity_id(pre_migration, tenant_key_target,
                                     matched_entities_dict_compare,
                                     config_dict_main, config_dict_target):

    same_entity_id_index_main_to_target = index_matched_entities(
        matched_entities_dict_compare)

    config_main_only = {}
    config_target_only = {}
    config_both = {}

    for entity_id_main, entity_keys_target in same_entity_id_index_main_to_target.items():
        type, entity_id_target = entity_keys_target

        (config_main_only, config_both) = compare_config(type, config_dict_main, entity_id_main, 'main', config_main_only,
                                                         config_dict_target, entity_id_target, 'target', config_both)
        (config_target_only, _) = compare_config(type, config_dict_target, entity_id_target, 'target', config_target_only,
                                                 config_dict_main, entity_id_main, 'main', {})

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


def format_all_to_table(config_target_only, config_main_only, config_both, result_table=None):

    if(result_table is None):
        result_table = {'legend': {'actions': {'del': 'D',
                                               'add': 'A', 'upd': 'U', 'identical': 'I'}}, 'entities': {}}

    #schema_dict = config_v2.extract_schemas(credentials.get_api_call_credentials())
    # for schema_dict in

    result_table = run_on_all_configs(
        'del', config_target_only, format_to_table, result_table)
    result_table = run_on_all_configs(
        'add', config_main_only, format_to_table, result_table)
    result_table = run_on_all_configs(
        'upd', config_both, format_to_table, result_table)

    return result_table


def flatten_results(result_table):

    for type in result_table['entities'].keys():
        type_dict = result_table['entities'][type]
        result_table['entities'][type] = {'items': list(type_dict.values())}

    return result_table


def run_on_all_configs(extra_input, config_dict, action_function, in_out_item):
    for schema_config_dict in config_dict.values():
        for config_id, config_dict in schema_config_dict.items():
            action_function(extra_input, config_id, config_dict, in_out_item)

    return in_out_item


def format_to_table(action, config_id, config_dict, result_table):

    entity_id_dict = config_dict['entity_id_dict']

    entity_id_from = entity_id_dict['from']
    entity_id_to = entity_id_dict['to']

    if(action == 'del'):
        entity_id_from = entity_id_dict['to']
        entity_id_to = entity_id_dict['from']

    type = config_dict['type']
    schema_id = config_dict['schema_id']

    if(type in result_table['entities']):
        pass
    else:
        result_table['entities'][type] = {}
        result_table['legend'][type] = {'id': 0, 'schemas': {}}

    if(schema_id in result_table['legend'][type]['schemas']):
        pass
    else:
        result_table['legend'][type]['schemas'][schema_id] = result_table['legend'][type]['id']
        result_table['legend'][type]['id'] += 1

    schema_key = result_table['legend'][type]['schemas'][schema_id]

    if(entity_id_to in result_table['entities'][type]):
        if(entity_id_from == result_table['entities'][type][entity_id_to]['from']):
            pass
        else:
            print("ERROR: Multiple sources for a single entity??")
            return

    else:
        result_table['entities'][type][entity_id_to] = {
            'to': entity_id_to, 'from': entity_id_from}

    if('identical' in config_dict
       and config_dict['identical'] == True):

        action = 'identical'

    result_table['entities'][type][entity_id_to][schema_key] = result_table['legend']['actions'][action]


def delete_config(api_config, config_id, config_dict, _):
    print('delete: ', config_id)
    url_trail = '/' + config_id
    api_v2.delete(
        api_config, api_v2.settings_objects, url_trail)


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

    print(config_dict)
    print(json.dumps(payload))

    return payload


def replace_entities(config_dict, config_tenant_type):

    entity_id_dict = config_dict['entity_id_dict']

    config_dict_target = config_dict[config_tenant_type]
    config_str = json.dumps(config_dict_target)
    config_str_replaced = config_str.replace(
        entity_id_dict['from'], entity_id_dict['to'])
    config_dict_replaced = json.loads(config_str_replaced)

    return config_dict_replaced


def compare_config(type, config_dict_from, entity_id_from, from_label, config_from_only,
                   config_dict_to, entity_id_to, to_label, config_both):

    if(type in config_dict_from['entity_config_index']):
        pass
    else:
        return (config_from_only, config_both)

    for schema_id, schema_dict_from in config_dict_from['entity_config_index'][type].items():

        entity_in_from = False
        if(entity_id_from in schema_dict_from):
            entity_in_from = True

        entity_id_in_to = False
        schema_dict_to = None
        try:
            schema_dict_to = config_dict_to[
                'entity_config_index'][type][schema_id]
            if(entity_id_to in schema_dict_to):
                entity_id_in_to = True
        except KeyError:
            pass

        if(entity_in_from):

            entity_id_dict = {'from': entity_id_from, 'to': entity_id_to}

            if(entity_id_in_to):
                create_update_configs(config_both, type, schema_id, entity_id_dict,
                                      config_dict_from, schema_dict_from, entity_id_from,
                                      config_dict_to, schema_dict_to, entity_id_to)
            else:
                config_from_only = add_configs(config_from_only, type, schema_id, 'current', schema_dict_from[entity_id_from][0],
                                               schema_dict_from[entity_id_from], config_dict_from, entity_id_dict)

    return (config_from_only, config_both)


def create_update_configs(config_both, type, schema_id, entity_id_dict,
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

    config_both = add_configs(config_both, type, schema_id, 'current', current_config_id,
                              config_list_to, config_dict_to, entity_id_dict, identical)
    config_both = add_configs(config_both, type, schema_id, 'source', current_config_id,
                              config_list_from, config_dict_from, identical=identical)


def add_configs(config_dict, type, schema_id, config_tenant_type, current_config_id,
                config_list, tenant_config_dict, entity_id_dict=None, identical=None):

    if(schema_id in config_dict):
        pass
    else:
        config_dict[schema_id] = {}

    if(current_config_id in config_dict[schema_id]):
        pass
    else:
        config_dict[schema_id][current_config_id] = {}

    object_id = config_list[0]
    print(tenant_config_dict, object_id)
    config_dict[schema_id][current_config_id][config_tenant_type] = tenant_config_dict['configs'][object_id]

    if(entity_id_dict is None):
        pass
    else:
        config_dict[schema_id][current_config_id]['entity_id_dict'] = entity_id_dict

    if(identical is None):
        pass
    else:
        config_dict[schema_id][current_config_id]['identical'] = identical

    config_dict[schema_id][current_config_id]['type'] = type
    config_dict[schema_id][current_config_id]['schema_id'] = schema_id

    # TODO: Deal with multi config per entity & multi entity per config
    if(len(config_list) > 1):
        print(
            "TODO: Deal with multi config per entity & multi entity per config",
            "\n", schema_id, config_list)

    return config_dict


def index_matched_entities(matched_entities_dict_compare):

    same_entity_id_index = {}

    for type in matched_entities_dict_compare.keys():

        for entity_id_target in matched_entities_dict_compare[type].keys():

            for matched_entity_id in matched_entities_dict_compare[type][entity_id_target]['match_entity_list'].keys():

                if('same_entity_id' in matched_entities_dict_compare[type][entity_id_target]['match_entity_list'][matched_entity_id]
                   or 'forced_match' in matched_entities_dict_compare[type][entity_id_target]['match_entity_list'][matched_entity_id]):

                    # TODO Add code to resolve multiple entities matching each other
                    if(matched_entity_id in same_entity_id_index):
                        print("TODO: Manage Override!!!", matched_entity_id, same_entity_id_index[matched_entity_id], (
                            type, entity_id_target))
                    same_entity_id_index[matched_entity_id] = (
                        type, entity_id_target)
                    # print('only: ', entity_id_target, matched_entity_id)
                    # print('only: ', matched_entities_dict_compare[type][entity_id_target]['match_entity_list'][matched_entity_id])
                    # print('only: ', matched_entities_dict_compare[type][entity_id_target])

    # print('only: ', same_entity_id_index)

    return same_entity_id_index
