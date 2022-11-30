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


def match_entities_tree(run_info, active_rules=None, context_params=None):

    matched_entities_dict, _ = get_entities_dict(
        run_info, active_rules, context_params)

    matched_entities_tree_dict = convert_matched_to_tree(matched_entities_dict)

    return matched_entities_tree_dict


def match_entities(run_info, active_rules=None, context_params=None):

    run_info, all_tenant_entity_dict = process_utils.execute_match(run_info, LoadEntities,
                                                                   entity_v2.extract_function,
                                                                   live_extract=False)

    matched_entities_dict, entities_dict = process_entities_match(
        run_info, all_tenant_entity_dict, active_rules, context_params)

    return matched_entities_dict, entities_dict


def match_entities_forced_live(run_info, active_rules=None, context_params=None):

    run_info, all_tenant_entity_dict = process_utils.execute_match(run_info, LoadEntities,
                                                                   entity_v2.extract_specific_scope,
                                                                   live_extract=True)

    matched_entities_dict, entities_dict = process_entities_match(
        run_info, all_tenant_entity_dict, active_rules, context_params)

    return matched_entities_dict, entities_dict


def get_entities_dict(run_info, active_rules, context_params):

    match_entities_function = match_entities

    if (run_info['forced_match']):

        match_entities_function = match_entities_forced_live

    matched_entities_dict, entities_dict = match_entities_function(
        run_info, active_rules, context_params)

    return matched_entities_dict, entities_dict


def process_entities_match(run_info, all_tenant_entity_dict, active_rules, context_params):

    index_dict = index_all_tenant_entity_dict(
        all_tenant_entity_dict, run_info)

    tenant_key_target = run_info['tenant_key_target']
    tenant_key_main = run_info['tenant_key_main']

    matched_entities_dict = process_match_rules(run_info,
                                                index_dict[tenant_key_target], index_dict[tenant_key_main],
                                                all_tenant_entity_dict[tenant_key_target][
                                                    'selected_entities'], all_tenant_entity_dict[tenant_key_main]['selected_entities'],
                                                active_rules, context_params)

    matched_entities_dict = prioritize_matches(run_info, matched_entities_dict)

    entities_dict = {
        tenant_key_target: all_tenant_entity_dict[tenant_key_target]['entities'],
        tenant_key_main: all_tenant_entity_dict[tenant_key_main]['entities']
    }

    return matched_entities_dict, entities_dict


def convert_matched_to_tree(entities_dict):
    for type in entities_dict.keys():

        entity_type_worst_match_type = 0

        for entity_id in entities_dict[type].keys():

            entity_match_type = entities_dict[type][entity_id]['match_type']
            if (entity_match_type > entity_type_worst_match_type):
                entity_type_worst_match_type = entity_match_type

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

                if (len(matching_children) > 0):
                    entities_dict[type][entity_id]['match_entity_list'][matched_entity_id]['children'] = matching_children

            entities_dict[type][entity_id]['children'] = convert_object_to_tree(
                entities_dict[type][entity_id]['match_entity_list'])['children']
            del entities_dict[type][entity_id]['match_entity_list']

        entities_dict[type] = convert_object_to_tree(entities_dict[type])

        if (entity_type_worst_match_type > 0):
            entities_dict[type]['match_type'] = entity_type_worst_match_type

    entities_dict = convert_object_to_tree(entities_dict)

    result = {'data': entities_dict}

    return result


def convert_object_to_tree(source_object):

    result_object = {}

    if (type(source_object) is dict
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

    elif (type(source_object) is list):
        result_object = {'children': source_object}

    else:
        result_object = source_object

    return result_object


def prioritize_matches(run_info, matched_entities_dict):

    for type, match_type_dict in matched_entities_dict.items():
        for entity_id_main, match_dict_main in match_type_dict.items():

            match_entity_list_target = match_dict_main['match_entity_list']
            best_matches = compare.get_top_matches(
                match_entity_list_target, 'weight')

            get_match_type_function = get_match_type_compare
            if (run_info['self_match']):
                get_match_type_function = get_match_type_self

            match_type = get_match_type_function(
                match_entity_list_target, entity_id_main, best_matches)

            match_dict_main['match_type'] = match_type

            for entity_id_best_match in best_matches.keys():
                match_dict_main['match_entity_list'][entity_id_best_match]['top_match'] = 'true'
                if (len(best_matches) == 1):
                    match_dict_main['match_entity_list'][entity_id_best_match]['only_top_match'] = 'true'
                if (len(best_matches) == 1
                   and entity_id_best_match == entity_id_main):
                    match_dict_main['match_entity_list'][entity_id_best_match]['same_entity_id'] = 'true'

            if (entity_id_main in match_entity_list_target):
                if (len(best_matches) == 1):
                    match_dict_main['match_entity_list'][entity_id_main]['match_type'] = match_type
                else:
                    match_dict_main['match_entity_list'][entity_id_main]['expected_match'] = 'true'

    return matched_entities_dict


def get_match_type_compare(match_entity_list_target, entity_id_main, best_matches):

    first_match_key = None
    if (len(best_matches) == 1):
        first_match_key = list(best_matches.keys())[0]

    if (len(best_matches) == 1
       and 'forced_match' in best_matches[first_match_key]
       and best_matches[first_match_key]['forced_match'] == True):
        match_type = 7  # Forced Match

    elif (len(match_entity_list_target) == 0):
        match_type = 6  # Not at all (Found no match)

    elif (len(match_entity_list_target) == 1
          and entity_id_main in match_entity_list_target):
        match_type = 1  # Perfect Match

    elif (len(best_matches) == 1):
        match_type = 2  # Good (Top 1 Alone)

    elif (len(best_matches) >= 1):
        match_type = 3  # Ambiguous (Top 1 ex aequo)

    else:
        match_type = 5  # Not Found

    return match_type


def get_match_type_self(match_entity_list_target, entity_id_main, best_matches):

    first_match_key = None
    if (len(best_matches) == 1):
        first_match_key = list(best_matches.keys())[0]

    if (len(best_matches) == 1
       and 'forced_match' in best_matches[first_match_key]
       and best_matches[first_match_key]['forced_match'] == True):
        match_type = 7  # Forced Match

    elif (len(match_entity_list_target) == 0):
        match_type = 6  # Not at all (Found no match)

    elif (len(match_entity_list_target) == 1
          and entity_id_main in match_entity_list_target):
        match_type = 1  # Perfect Match

    elif (len(best_matches) == 1
          and entity_id_main in best_matches):
        match_type = 2  # Good (Top 1 Alone)

    elif (len(best_matches) >= 1
          and entity_id_main in best_matches):
        match_type = 3  # Ambiguous (Top 1 ex aequo)

    elif (entity_id_main in match_entity_list_target):
        match_type = 4  # Bad (Not Top 1)

    else:
        match_type = 5  # Not Found

    return match_type


def process_match_rules(run_info, index_dict_target, index_dict_main,
                        tenant_entity_dict_target, tenant_entity_dict_main,
                        active_rules, context_params):

    matched_entities_dict = init_matched_entities(tenant_entity_dict_main)

    for entity_type in index_dict_main:

        if entity_type in tenant_entity_dict_target:
            pass
        else:
            continue

        for match_key, match_config in match_rules_catalog.items():

            if (active_rules is None
               or match_key in active_rules):
                pass
            else:
                continue

            if (run_info['self_match'] == True
               and 'self_match_disabled' in match_config
               and match_config['self_match_disabled'] == True):
                continue

            if (match_config['action'] == 'index'):
                matched_entities_dict = match_index(matched_entities_dict, match_key, match_config, index_dict_target,
                                                    index_dict_main, entity_type, tenant_entity_dict_target, tenant_entity_dict_main)
            elif (match_config['action'] == 'provided_id'):
                matched_entities_dict = match_provided_id(run_info, matched_entities_dict, match_key, match_config,
                                                          entity_type, tenant_entity_dict_target, tenant_entity_dict_main, context_params)

    return matched_entities_dict


def match_index(matched_entities_dict, match_key, match_config, index_dict_target, index_dict_main, entity_type, tenant_entity_dict_target, tenant_entity_dict_main):

    dict_items_match_key = None
    try:
        dict_items_match_key = index_dict_main[entity_type][match_key].items(
        )
    except KeyError:
        return matched_entities_dict

    for entity_value_main, entity_id_list_main in dict_items_match_key:

        entity_id_list_target = None
        try:
            entity_id_list_target = index_dict_target[entity_type][match_key][entity_value_main]
        except KeyError:
            continue

        if (entity_id_list_target is None):
            pass

        else:
            matched_entities_dict[entity_type] = add_match(matched_entities_dict[entity_type], entity_value_main,
                                                           entity_id_list_main, entity_id_list_target, match_key, match_config, tenant_entity_dict_target[entity_type], tenant_entity_dict_main[entity_type])

    return matched_entities_dict


def match_provided_id(run_info, matched_entities_dict, match_key, match_config,
                      entity_type, tenant_entity_dict_target, tenant_entity_dict_main, context_params):

    if (run_info['forced_match']):
        pass
    else:
        return matched_entities_dict

    for entity_id_target, entity_id_main in context_params['provided_id'].items():

        for entity_type, tenant_type_entity_dict_main in tenant_entity_dict_main.items():

            if (entity_id_main in tenant_type_entity_dict_main
               and entity_type in tenant_entity_dict_target
               and entity_id_target in tenant_entity_dict_target[entity_type]):

                matched_entity_dict_main = matched_entities_dict[
                    entity_type][entity_id_main]['match_entity_list']

                matched_entities_dict[entity_type][entity_id_main]['match_entity_list'] = add_matched_entity(
                    entity_id_target, matched_entity_dict_main, tenant_entity_dict_target[entity_type], match_config, match_key, tenant_type_entity_dict_main[entity_id_main], forced_match=True)

    return matched_entities_dict


def init_matched_entities(tenant_entity_dict_main):
    matched_entities_dict = {}

    for type in tenant_entity_dict_main:
        if (type in matched_entities_dict):
            pass
        else:
            matched_entities_dict[type] = {}

        for entity_id, entity_dict in tenant_entity_dict_main[type].items():
            if (entity_id in matched_entities_dict[type]):
                pass
            else:
                matched_entities_dict[type][entity_id] = {
                    'displayName': entity_dict['displayName'], 'lastSeenTms': entity_dict['lastSeenTms'], 'match_entity_list': {}}

    return matched_entities_dict


def add_match(matched_entities_type_dict, entity_value_main, entities_main, entities_target, match_key, match_config, tenant_type_entity_dict_target, tenant_type_entity_dict_main):

    for entity_id_main in entities_main.keys():

        matched_entity_dict_main = matched_entities_type_dict[
            entity_id_main]['match_entity_list']

        all_keys = list(entities_target.keys())
        if(len(all_keys) > 10):
            print("AAAAA Too many matches: ", match_key, entity_id_main, len(all_keys), all_keys)

        for entity_id_target in entities_target.keys():
            matched_entities_type_dict[entity_id_main]['match_entity_list'] = add_matched_entity(
                entity_id_target, matched_entity_dict_main, tenant_type_entity_dict_target, match_config, match_key, entity_value_main)

    return matched_entities_type_dict


def add_matched_entity(entity_id_target, matched_entity_dict_main, tenant_type_entity_dict_target, match_config, match_key, entity_value_main, forced_match=False):

    entity_target = None

    if (entity_id_target in matched_entity_dict_main):
        pass
    else:
        entity_target = tenant_type_entity_dict_target[entity_id_target]

        matched_entity_dict_main[entity_id_target] = {'displayName': entity_target['displayName'],
                                                      'lastSeenTms': entity_target['lastSeenTms'], 'weight': Weight(), 'match_rules': {}}

    matched_entity_dict_target = matched_entity_dict_main[entity_id_target]

    matched_entity_dict_target['weight'].add_weight(
        match_config['weight_type_value'], match_config['weight_value'])

    match_rule_name = match_key + ': ' + match_rules_catalog[match_key]['name']

    if (match_rule_name in matched_entity_dict_target['match_rules']):
        pass
    else:
        matched_entity_dict_target['match_rules'][match_rule_name] = {}

    matched_entity_dict_target['match_rules'][match_rule_name] = entity_value_main

    if (forced_match == True):
        matched_entity_dict_target['forced_match'] = forced_match

    if (len(matched_entity_dict_main) > 100):
        print("Inefficient Matching, Code should be reviewed")
        print(len(matched_entity_dict_main), entity_id_target,
              match_rule_name, entity_value_main)
        if (entity_target is None):
            pass
        else:
            print(entity_target['type'])

    return matched_entity_dict_main


def index_all_tenant_entity_dict(all_tenant_entity_dict, run_info):

    index_dict = {}

    for tenant_dict in run_info['tenant_param_dict'].values():
        tenant_key = tenant_dict['tenant_key']
        index_dict[tenant_key] = index_tenant_entity_dict(
            all_tenant_entity_dict[tenant_key]['selected_entities'])

    return index_dict


def index_tenant_entity_dict(tenant_entity_dict):

    index_dict = {}

    for type, entity_dict in tenant_entity_dict.items():

        if (type in index_dict):
            pass
        else:
            index_dict[type] = {}

        index_type_dict = index_dict[type]

        for entity_id, entity in entity_dict.items():

            for match_key, match_config in match_rules_catalog.items():

                if (match_config['action'] == 'index'):

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

    if (value is None
       or value == ''):
        return

    if (type(value) is list):

        for sub_value in value:
            add_single_value_to_index(
                index_type_dict, index_key, sub_value, entity_id)
    else:
        add_single_value_to_index(index_type_dict, index_key, value, entity_id)


def add_single_value_to_index(index_type_dict, index_key, value, entity_id):

    if (value is None
       or value == ''):
        return

    if (index_key in index_type_dict):
        pass
    else:
        index_type_dict[index_key] = {}

    index = index_type_dict[index_key]

    if (value in index):
        pass
    else:
        index[value] = {}

    index[value][entity_id] = True


class LoadEntities:

    def __init__(self, run_info):

        self.results = {}
        self.results['selected_entities'] = {}
        self.results['entities'] = {}
        self.analysis_filter = run_info['analysis_filter']

    def analyze(self, entities_data):

        if ('errorCode' in entities_data):
            print("Error for ", entities_data)

        else:
            self.add_entities(entities_data['entities'])

    def add_entities(self, entity_list):

        for entity in entity_list:

            if (self.analysis_filter.is_entity_seleted(entity)):

                self.add_selected_entity(entity)

            self.add_entity(entity)

    def add_selected_entity(self, entity):

        type = entity['type']
        entity_id = entity['entityId']

        if (type in self.results['selected_entities']):
            pass

        else:
            self.results['selected_entities'][type] = {}

        self.results['selected_entities'][type][entity_id] = entity

    def add_entity(self, entity):

        entity_id = entity['entityId']

        self.results['entities'][entity_id] = entity['displayName']

    def get_results(self):
        return self.results
