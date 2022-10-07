import handler_api
import entity_v2
from weight import Weight
import compare
import process_utils

match_rules_catalog = {
    '0': {
        'name': 'Entity Id',
        'path': ['entityId'],
        'action': 'index',
        'weight_type_value': 100,
        'weight_value': 1,
        'self_match_disabled': True,
    },
    '1': {
        'name': 'DetectedName',
        'path': ['properties', 'detectedName'],
        'action': 'index',
        'weight_type_value': 90,
        'weight_value': 10,
    },
    '2': {
        'name': 'oneAgentCustomHostName',
        'path': ['properties', 'oneAgentCustomHostName'],
        'action': 'index',
        'weight_type_value': 90,
        'weight_value': 10,
    },
    '3': {
        'name': 'displayName',
        'path': ['displayName'],
        'action': 'index',
        'weight_type_value': 90,
        'weight_value': 5,
    },
    '4': {
        'name': 'ipAddress',
        'path': ['properties', 'ipAddress'],
        'action': 'index',
        'weight_type_value': 10,
        'weight_value': 10,
    },
    '6': {
        'name': 'providedId',
        'action': 'provided_id',
        'weight_type_value': 99999999,
        'weight_value': 1,
    },
}


def match_entities_tree(tenant_key_main, tenant_key_target, analysis_filter, active_rules=None, context_params=None):

    matched_entities_dict = match_entities(
        tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params)

    matched_entities_tree_dict = convert_matched_to_tree(matched_entities_dict)

    result = {'data': matched_entities_tree_dict}

    return result


def match_entities(tenant_key_main, tenant_key_target, analysis_filter, active_rules=None, context_params=None):

    run_info, all_tenant_entity_dict = process_utils.execute_match(tenant_key_main, tenant_key_target,
                                                                   LoadEntities, analysis_filter,
                                                                   entity_v2.extract_function,
                                                                   context_params, live_extract=False)

    matched_entities_dict = process_entities_match(
        run_info, all_tenant_entity_dict, active_rules, context_params)

    return matched_entities_dict


def match_entities_forced_live(tenant_key_main, tenant_key_target, analysis_filter, active_rules=None, context_params=None):

    run_info, all_tenant_entity_dict = process_utils.execute_match(tenant_key_main, tenant_key_target,
                                                                   LoadEntities, analysis_filter,
                                                                   entity_v2.extract_specific_scope,
                                                                   context_params, live_extract=True)

    matched_entities_dict = process_entities_match(
        run_info, all_tenant_entity_dict, active_rules, context_params)

    return matched_entities_dict


def process_entities_match(run_info, all_tenant_entity_dict, active_rules, context_params):

    index_dict = index_all_tenant_entity_dict(
        all_tenant_entity_dict, run_info)

    tenant_key_main = run_info['tenant_key_main']
    tenant_key_target = run_info['tenant_key_target']

    matched_entities_dict = process_match_rules(run_info,
                                                index_dict[tenant_key_main], index_dict[tenant_key_target],
                                                all_tenant_entity_dict[tenant_key_main], all_tenant_entity_dict[tenant_key_target],
                                                active_rules, context_params)

    matched_entities_dict = prioritize_matches(matched_entities_dict)

    return matched_entities_dict


def convert_matched_to_tree(entities_dict):
    for type in entities_dict.keys():

        for entity_id in entities_dict[type].keys():

            for matched_entity_id in entities_dict[type][entity_id]['match_entity_list'].keys():

                matching_children = []

                if 'match_rules' in entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]:
                    converted_match_rules = convert_object_to_tree(
                        entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]['match_rules'])

                    matching_children.append(
                        {'name': 'match_rules', 'children': converted_match_rules['children']})

                    del entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]['match_rules']

                if 'weight' in entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]:

                    converted_weight = convert_object_to_tree(
                        entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]['weight'])

                    matching_children.append(
                        {'name': 'weight', 'children': converted_weight['children']})

                    del entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]['weight']

                if(len(matching_children) > 0):
                    entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]['children'] = matching_children

            entities_dict[type][entity_id]['children'] = convert_object_to_tree(
                entities_dict[type][entity_id]['match_entity_list'])['children']
            del entities_dict[type][entity_id]['match_entity_list']

        entities_dict[type] = convert_object_to_tree(entities_dict[type])

    entities_dict = convert_object_to_tree(entities_dict)
    return entities_dict


def convert_object_to_tree(source_object):

    result_object = {}

    if(type(source_object) is dict
       or issubclass(type(source_object), dict)):

        children = []
        for key, data in source_object.items():

            output_data = None
            try:
                output_data = data
                output_data['name'] = str(key)
            except TypeError as e:
                output_data = {'name': str(key), 'value': str(data)}

            children.append(output_data)

        result_object = {'children': children}

    elif(type(source_object) is list):
        result_object = {'children': source_object}

    else:
        result_object = source_object

    return result_object


def prioritize_matches(matched_entities_dict):

    for type, match_type_dict in matched_entities_dict.items():
        for entity_id_target, match_dict_target in match_type_dict.items():

            match_entity_list_main = match_dict_target['match_entity_list']
            best_matches = compare.get_top_matches(
                match_entity_list_main, 'weight')

            match_type = get_match_type(
                match_entity_list_main, entity_id_target, best_matches)

            match_dict_target['match_type'] = match_type

            for entity_id_best_match in best_matches.keys():
                match_dict_target['match_entity_list'][entity_id_best_match]['top_match'] = 'true'
                if(len(best_matches) == 1):
                    match_dict_target['match_entity_list'][entity_id_best_match]['only_top_match'] = 'true'
                if(len(best_matches) == 1
                   and entity_id_best_match == entity_id_target):
                    match_dict_target['match_entity_list'][entity_id_best_match]['same_entity_id'] = 'true'

            if(entity_id_target in match_entity_list_main):
                if(len(best_matches) == 1):
                    match_dict_target['match_entity_list'][entity_id_target]['match_type'] = match_type
                else:
                    match_dict_target['match_entity_list'][entity_id_target]['expected_match'] = 'true'

    return matched_entities_dict


def get_match_type(match_entity_list_main, entity_id_target, best_matches):

    first_match_key = None
    if(len(best_matches) == 1):
        first_match_key = list(best_matches.keys())[0]

    if(len(best_matches) == 1
       and 'forced_match' in best_matches[first_match_key]
       and best_matches[first_match_key]['forced_match'] == True):
        match_type = 7  # Forced Match

    elif(len(match_entity_list_main) == 0):
        match_type = 6  # Not at all

    elif(len(match_entity_list_main) == 1
         and entity_id_target in match_entity_list_main):
        match_type = 1  # Perfect

    elif(len(best_matches) == 1
         and entity_id_target in best_matches):
        match_type = 2  # Good

    elif(len(best_matches) >= 1
         and entity_id_target in best_matches):
        match_type = 3  # Ambiguous

    elif(entity_id_target in match_entity_list_main):
        match_type = 4  # Bad

    else:
        match_type = 5  # Not in the results

    return match_type


def process_match_rules(run_info, index_dict_main, index_dict_target,
                        tenant_entity_dict_main, tenant_entity_dict_target,
                        active_rules, context_params):

    matched_entities_dict = init_matched_entities(tenant_entity_dict_target)

    for entity_type in index_dict_target:

        if entity_type in tenant_entity_dict_main:
            pass
        else:
            continue

        for match_key, match_config in match_rules_catalog.items():

            if(active_rules is None
               or match_key in active_rules):
                pass
            else:
                continue

            if(run_info['self_match'] == True
               and 'self_match_disabled' in match_config
               and match_config['self_match_disabled'] == True):
                continue

            if(match_config['action'] == 'index'):
                matched_entities_dict = match_index(matched_entities_dict, match_key, match_config, index_dict_main,
                                                    index_dict_target, entity_type, tenant_entity_dict_main, tenant_entity_dict_target)
            elif(match_config['action'] == 'provided_id'):
                matched_entities_dict = match_provided_id(matched_entities_dict, match_key, match_config,
                                                          entity_type, tenant_entity_dict_main, tenant_entity_dict_target, context_params)

    return matched_entities_dict


def match_index(matched_entities_dict, match_key, match_config, index_dict_main, index_dict_target, entity_type, tenant_entity_dict_main, tenant_entity_dict_target):

    dict_items_match_key = None
    try:
        dict_items_match_key = index_dict_target[entity_type][match_key].items(
        )
    except KeyError:
        return matched_entities_dict

    for entity_value_target, entity_id_list_target in dict_items_match_key:

        entity_id_list_main = None
        try:
            entity_id_list_main = index_dict_main[entity_type][match_key][entity_value_target]
        except KeyError:
            continue

        if(entity_id_list_main is None):
            pass

        else:

            add_match(matched_entities_dict[entity_type], entity_value_target,
                      entity_id_list_target, entity_id_list_main, match_key, match_config, tenant_entity_dict_main[entity_type], tenant_entity_dict_target[entity_type])

    return matched_entities_dict


def match_provided_id(matched_entities_dict, match_key, match_config,
                      entity_type, tenant_entity_dict_main, tenant_entity_dict_target, context_params):

    if(context_params is None):
        return matched_entities_dict

    if('provided_id' in context_params):
        pass
    else:
        return matched_entities_dict

    for entity_id_target, entity_id_main in context_params['provided_id'].items():

        for entity_type, tenant_type_entity_dict_target in tenant_entity_dict_target.items():

            if(entity_id_target in tenant_type_entity_dict_target
               and entity_type in tenant_entity_dict_main
               and entity_id_main in tenant_entity_dict_main[entity_type]):

                matched_entity_dict_target = matched_entities_dict[
                    entity_type][entity_id_target]['match_entity_list']

                matched_entity_dict_target = add_matched_entity(
                    entity_id_main, matched_entity_dict_target, tenant_entity_dict_main[entity_type], match_config, match_key, tenant_type_entity_dict_target[entity_id_target], forced_match=True)

    return matched_entities_dict


def init_matched_entities(tenant_entity_dict_target):
    matched_entities_dict = {}

    for type in tenant_entity_dict_target:
        if(type in matched_entities_dict):
            pass
        else:
            matched_entities_dict[type] = {}

        for entity_id, entity_dict in tenant_entity_dict_target[type].items():
            if(entity_id in matched_entities_dict[type]):
                pass
            else:
                matched_entities_dict[type][entity_id] = {
                    'displayName': entity_dict['displayName'], 'lastSeenTms': entity_dict['lastSeenTms'], 'match_entity_list': {}}

    return matched_entities_dict


def add_match(matched_entities_type_dict, entity_value_target, entities_target, entities_main, match_key, match_config, tenant_type_entity_dict_main, tenant_type_entity_dict_target):

    for entity_id_target in entities_target.keys():

        matched_entity_dict_target = matched_entities_type_dict[
            entity_id_target]['match_entity_list']

        for entity_id_main in entities_main.keys():
            matched_entity_dict_target = add_matched_entity(
                entity_id_main, matched_entity_dict_target, tenant_type_entity_dict_main, match_config, match_key, entity_value_target)


def add_matched_entity(entity_id_main, matched_entity_dict_target, tenant_type_entity_dict_main, match_config, match_key, entity_value_target, forced_match=False):

    if(entity_id_main in matched_entity_dict_target):
        pass
    else:
        entity_main = tenant_type_entity_dict_main[entity_id_main]

        matched_entity_dict_target[entity_id_main] = {'displayName': entity_main['displayName'],
                                                      'lastSeenTms': entity_main['lastSeenTms'], 'weight': Weight(), 'match_rules': {}}

    matched_entity_dict_main = matched_entity_dict_target[entity_id_main]

    matched_entity_dict_main['weight'].add_weight(
        match_config['weight_type_value'], match_config['weight_value'])

    match_rule_name = match_key + ': ' + match_rules_catalog[match_key]['name']

    if(match_rule_name in matched_entity_dict_main['match_rules']):
        pass
    else:
        matched_entity_dict_main['match_rules'][match_rule_name] = {}

    matched_entity_dict_main['match_rules'][match_rule_name] = entity_value_target

    if(forced_match == True):
        matched_entity_dict_main['forced_match'] = forced_match

    return matched_entity_dict_target


def index_all_tenant_entity_dict(all_tenant_entity_dict, run_info):

    index_dict = {}

    for tenant_dict in run_info['tenant_dict_list']:
        tenant_key = tenant_dict['tenant_key']
        index_dict[tenant_key] = index_tenant_entity_dict(
            all_tenant_entity_dict[tenant_key])

    return index_dict


def index_tenant_entity_dict(tenant_entity_dict):

    index_dict = {}

    for type, entity_dict in tenant_entity_dict.items():

        if(type in index_dict):
            pass
        else:
            index_dict[type] = {}

        index_type_dict = index_dict[type]

        for entity_id, entity in entity_dict.items():

            for match_key, match_config in match_rules_catalog.items():

                if(match_config['action'] == 'index'):

                    value = get_json_value_from_path(
                        entity, match_config['path'])
                    add_value_to_index(
                        index_type_dict, match_key, value, entity_id)

    return index_dict


def get_json_value_from_path(entity, path):
    current = None

    try:
        current = entity

        for key in path:
            current = current[key]
    except Exception as e:
        return None

    return current


def add_value_to_index(index_type_dict, index_key, value, entity_id):

    if(value is None
       or value == ''):
        return

    if(type(value) is list):

        for sub_value in value:
            add_single_value_to_index(
                index_type_dict, index_key, sub_value, entity_id)
    else:
        add_single_value_to_index(index_type_dict, index_key, value, entity_id)


def add_single_value_to_index(index_type_dict, index_key, value, entity_id):

    if(value is None
       or value == ''):
        return

    if(index_key in index_type_dict):
        pass
    else:
        index_type_dict[index_key] = {}

    index = index_type_dict[index_key]

    if(value in index):
        pass
    else:
        index[value] = {}

    index[value][entity_id] = True


class LoadEntities:

    def __init__(self, analysis_filter):

        self.results = {}
        self.analysis_filter = analysis_filter

    def analyze(self, entities_data):

        if('errorCode' in entities_data):
            print("Error for ", entities_data)

        else:
            self.add_entities(entities_data['entities'])

    def add_entities(self, entity_list):

        for entity in entity_list:

            if(self.analysis_filter.is_entity_seleted(entity)):

                self.add_entity(entity)

    def add_entity(self, entity):

        type = entity['type']
        entity_id = entity['entityId']

        if (type in self.results):
            pass

        else:
            self.results[type] = {}

        self.results[type][entity_id] = entity

    def get_results(self):
        return self.results
