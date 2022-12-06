import entity_v2
from weight import Weight
import compare
import process_utils

max_entities_per_index_value = 50

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

    tenant_key_target = run_info['tenant_key_target']
    tenant_key_main = run_info['tenant_key_main']

    matched_entities_dict = process_match_rules(run_info,
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

    entities_dict['name'] = "Matched Entities"
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


def process_match_rules(run_info,
                        tenant_entity_dict_target, tenant_entity_dict_main,
                        active_rules, context_params):

    matched_entities_dict = init_matched_entities(tenant_entity_dict_main)

    sorted_active_match_rules = get_sorted_active_match_rules(
        run_info, active_rules)

    for entity_type, entity_type_dict_main in tenant_entity_dict_main.items():

        matched_entities_dict = process_match_entity_type(run_info, matched_entities_dict, entity_type,
                                                          entity_type_dict_main, tenant_entity_dict_main,
                                                          tenant_entity_dict_target,
                                                          sorted_active_match_rules, context_params)

    return matched_entities_dict


def process_match_entity_type(run_info, matched_entities_dict, entity_type,
                              entity_type_dict_main, tenant_entity_dict_main,
                              tenant_entity_dict_target,
                              sorted_active_match_rules, context_params):

    index_dict_target = {}

    if (entity_type in tenant_entity_dict_target):

        entity_type_dict_target = tenant_entity_dict_target[entity_type]
        index_dict_target = index_type_entity_dict(sorted_active_match_rules,
                                                   entity_type_dict_target)

    else:

        return matched_entities_dict

    previous_weight_type_value = None

    for entity_id_main, entity_main in entity_type_dict_main.items():

        kept_weighted_entity_match_dict = {}
        first_match_layer = True
        current_weighted_entity_match_dict = {}
        current_max_weight = 0

        for match_key, match_config in sorted_active_match_rules.items():

            current_weight_type_value = match_config['weight_type_value']
            current_weight_value = match_config['weight_value']

            if (previous_weight_type_value is None):
                pass
            elif (previous_weight_type_value != current_weight_type_value):

                kept_weighted_entity_match_dict = process_weight_type_change(first_match_layer, entity_id_main, current_max_weight, current_weight_type_value,
                                                                             current_weighted_entity_match_dict, kept_weighted_entity_match_dict)

                current_weighted_entity_match_dict = {}
                if (len(kept_weighted_entity_match_dict.keys()) >= 1):
                    first_match_layer = False

                current_max_weight = 0

                if (len(kept_weighted_entity_match_dict.keys()) == 1):
                    break

            previous_weight_type_value = current_weight_type_value

            if (match_config['action'] == 'index'):

                entity_value_main = get_json_value_from_path(
                    entity_main, match_config['path'])

                if (entity_value_main is None
                   or entity_value_main == ""):
                    continue

                entity_value_main_list = []

                if (type(entity_value_main) is list):
                    entity_value_main_list = entity_value_main
                else:
                    entity_value_main_list = [entity_value_main]

                for value in entity_value_main_list:

                    entity_id_dict_target = None
                    try:
                        entity_id_dict_target = index_dict_target[match_key][value]
                    except KeyError:
                        continue
                    

                    if (entity_id_dict_target is None):
                        pass
                    elif(entity_id_dict_target['disabled'] == True):
                        pass
                    elif (len(entity_id_dict_target['entities']) > 0):

                        entity_id_list_target = list(
                            entity_id_dict_target['entities'].keys())

                        for entity_id_target in entity_id_list_target:

                            current_weighted_entity_match_dict, current_max_weight = add_current_weighted_entity(
                                first_match_layer, current_max_weight, entity_id_main, entity_id_target,
                                match_key, current_weight_value, value,
                                current_weighted_entity_match_dict, kept_weighted_entity_match_dict,
                                forced_match=False)

            elif (match_config['action'] == 'provided_id'):

                for entity_id_target, entity_id_forced_main in context_params['provided_id'].items():

                    if (entity_id_forced_main == entity_id_main):

                        if (entity_id_forced_main in entity_type_dict_main
                                and entity_id_target in entity_type_dict_target):

                            value = entity_id_target

                            current_weighted_entity_match_dict, current_max_weight = add_current_weighted_entity(
                                first_match_layer, current_max_weight, entity_id_main, entity_id_target,
                                match_key, current_weight_value, value,
                                current_weighted_entity_match_dict, kept_weighted_entity_match_dict,
                                forced_match=True)

            kept_weighted_entity_match_dict = process_weight_type_change(
                first_match_layer, entity_id_main, current_max_weight, current_weight_type_value,
                current_weighted_entity_match_dict, kept_weighted_entity_match_dict)

            for entity_id_target, kept_entity_matched_dict in kept_weighted_entity_match_dict.items():

                for match_rule_type in kept_entity_matched_dict:

                    for match_rule in match_rule_type['match_rules']:

                        forced_match = False
                        if ('forced_match' in match_rule
                           and match_rule['forced_match'] == True):
                            forced_match = True

                        matched_entities_dict[entity_type][entity_id_main]['match_entity_list'] = add_matched_entity(
                            entity_id_target, matched_entities_dict[entity_type][
                                entity_id_main]['match_entity_list'],
                            entity_type_dict_target, match_config, match_rule['match_key'], match_rule['value'], forced_match)

    return matched_entities_dict


def add_current_weighted_entity(first_match_layer, current_max_weight, entity_id_main, entity_id_target,
                                match_key, current_weight_value, value,
                                current_weighted_entity_match_dict, kept_weighted_entity_match_dict,
                                forced_match=False):

    if (first_match_layer):
        pass
    elif (entity_id_target in kept_weighted_entity_match_dict):
        pass
    elif (entity_id_target == entity_id_main):
        pass
    else:
        return current_weighted_entity_match_dict, current_max_weight

    if (entity_id_target in current_weighted_entity_match_dict):
        pass
    else:
        current_weighted_entity_match_dict[entity_id_target] = {
            'weight': 0, 'match_rules': []}

    current_weighted_entity_match_dict[entity_id_target]['weight'] += current_weight_value
    current_weighted_entity_match_dict[entity_id_target]['match_rules'].append(
        {'match_key': match_key, 'value': value, 'forced_match': forced_match})

    if (current_weighted_entity_match_dict[entity_id_target]['weight'] > current_max_weight):
        current_max_weight = current_weighted_entity_match_dict[
            entity_id_target]['weight']

    return current_weighted_entity_match_dict, current_max_weight


def process_weight_type_change(first_match_layer, entity_id_main, max_weight, current_weight_type_value,
                               current_weighted_entity_match_dict, kept_weighted_entity_match_dict):

    if (len(current_weighted_entity_match_dict.keys()) >= 1):
        pass
    else:
        return kept_weighted_entity_match_dict

    kept_weighted_entity_match_dict_new = {}

    for entity_id_matched_target, entity_matched_dict in current_weighted_entity_match_dict.items():

        if (entity_id_matched_target == entity_id_main
                or entity_matched_dict['weight'] >= max_weight):
            pass
        else:
            continue

        if (entity_id_matched_target in kept_weighted_entity_match_dict):
            kept_weighted_entity_match_dict_new[entity_id_matched_target] = kept_weighted_entity_match_dict[entity_id_matched_target]
        else:
            if (len(kept_weighted_entity_match_dict.keys()) > max_entities_per_index_value):
                if (entity_id_matched_target == entity_id_main):
                    pass
                else:
                    print("ERROR: TOO MANY MATCHES FOR: ", entity_id_main,
                          "DROPPING ENTITY: ", entity_id_matched_target)
                    print("TODO: Display ERROR in the UI")
                    continue

            kept_weighted_entity_match_dict_new[entity_id_matched_target] = []

        entity_matched_dict['weight_type_value'] = current_weight_type_value
        kept_weighted_entity_match_dict_new[entity_id_matched_target].append(
            entity_matched_dict)

    return kept_weighted_entity_match_dict_new


def get_sorted_active_match_rules(run_info, active_rules):

    active_match_rules = {}
    for match_key, match_config in match_rules_catalog.items():

        if (run_info['self_match'] == True
            and 'self_match_disabled' in match_config
                and match_config['self_match_disabled'] == True):

            continue

        elif (run_info['forced_match'] == False
              and match_config['action'] == 'provided_id'):

            continue

        elif (active_rules is None
                or match_key in active_rules):

            active_match_rules[match_key] = match_config

        else:

            continue

    sorted_active_match_rules = dict(
        sorted(active_match_rules.items(), key=lambda item: item[1]['weight_type_value'], reverse=True))

    return sorted_active_match_rules


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


def index_type_entity_dict(sorted_active_match_rules, entity_type_dict):

    index_dict = {}

    for entity_id, entity in entity_type_dict.items():

        for match_key, match_config in sorted_active_match_rules.items():

            if (match_config['action'] == 'index'):

                value = get_json_value_from_path(
                    entity, match_config['path'])
                add_value_to_index(
                    index_dict, match_key, value, entity_id)

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
        index[value] = {"disabled": False, "entities": {}}

    if (index[value]["disabled"] == True):
        return

    index[value]["entities"][entity_id] = True

    if (len(index[value]["entities"].keys()) > 50):
        print("ERROR: Entity Matching - Disabling index to avoid performance issues: ", entity_id, value, len(index[value]["entities"].keys()),
              "\n", "TODO: Rewrite Matching to avoid this issue")
        index[value]["disabled"] = True
        index[value]["entities"] = {}


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
