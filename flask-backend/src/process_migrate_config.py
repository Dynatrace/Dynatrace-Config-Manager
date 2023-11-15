# Copyright 2023 Dynatrace LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#      https://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import json

import api_v2
import compare
import credentials
import entity_utils
import monaco_cli_match
import process_match_entities
import process_match_settings_2_0
import process_utils
import terraform_cli
import terraform_local
import terraform_state
import ui_api_entity_config

from exception import SettingsValidationError

ACTION_ADD = "Add"
ACTION_DELETE = "Delete"
ACTION_UPDATE = "Update"
ACTION_IDENTICAL = "Identical"
ACTION_DONE = "Identical"
ACTION_PREEMPTIVE = "Preemptive"
# ACTION_REFRESH = "Refresh"
ACTION_ERROR = "Error"

ACTION_MAP = {
    ACTION_DELETE: "D",
    ACTION_ADD: "A",
    ACTION_UPDATE: "U",
    ACTION_IDENTICAL: "I",
    ACTION_DONE: "I",
    ACTION_PREEMPTIVE: "P",
    # ACTION_REFRESH: "R",
    ACTION_ERROR: "E",
}


def migrate_config(
    run_info,
    tenant_key_main,
    tenant_key_target,
    active_rules,
    context_params,
    pre_migration=False,
):
    matched_entities_dict, entities_dict, entity_legacy_match = get_match_dict(
        run_info, tenant_key_main, tenant_key_target, active_rules, context_params
    )

    all_tenant_config_dict, is_legacy_config_match, flat_result_table = get_config_dict(
        run_info, tenant_key_main, tenant_key_target, entity_legacy_match
    )

    if is_legacy_config_match:
        result_table = copy_configs_safe_same_entity_id(
            run_info,
            context_params,
            pre_migration,
            tenant_key_target,
            matched_entities_dict,
            entities_dict,
            all_tenant_config_dict[tenant_key_main],
            all_tenant_config_dict[tenant_key_target],
        )

        if run_info["forced_match"]:
            result_table = ui_api_entity_config.copy_entity(
                run_info, result_table, pre_migration
            )

        flat_result_table = flatten_results(result_table)

    return flat_result_table


def get_match_dict(
    run_info, tenant_key_main, tenant_key_target, active_rules, context_params
):
    (
        run_legacy_match,
        matched_entities_dict,
        entities_dict,
    ) = monaco_cli_match.try_monaco_match_entities(
        run_info, tenant_key_main, tenant_key_target
    )

    if run_legacy_match:
        print("Legacy Entity Matching Disabled")
        process_utils.add_aggregate_error(
            run_info,
            f"ERROR: Entities not downloaded?",
        )
        run_info["return_status"] = 400
        """
        matched_entities_dict, entities_dict = process_match_entities.get_entities_dict(
            run_info, active_rules, context_params
        )
        """

    return matched_entities_dict, entities_dict, run_legacy_match


def get_config_dict(run_info, tenant_key_main, tenant_key_target, entity_legacy_match):
    all_tenant_config_dict = None
    run_legacy_match = entity_legacy_match
    ui_payload = None

    if run_legacy_match:
        pass
    else:
        run_legacy_match, flat_result_table = monaco_cli_match.try_monaco_match_configs(
            run_info, tenant_key_main, tenant_key_target
        )

    if run_legacy_match:
        print("Using Legacy Matching")
        config_function = process_match_settings_2_0.match_config

        if run_info["forced_match"]:
            config_function = process_match_settings_2_0.match_config_forced_live

        if run_info["forced_match"]:
            all_tenant_config_dict = config_function(run_info)
        else:
            print("Legacy Config Matching disabled for complete tenant matching")

            process_utils.add_aggregate_error(
                run_info,
                f"ERROR: Entities or Configs not downloaded?",
            )
            run_info["return_status"] = 400
            run_legacy_match = False

    else:
        terraform_state.keep_state_for_IDs(
            tenant_key_main, tenant_key_target, tenant_key_target
        )

        terraform_cli.create_terraform_repo(
            run_info, tenant_key_main, tenant_key_target
        )
        if "return_status" in run_info and run_info["return_status"] >= 300:
            return all_tenant_config_dict, run_legacy_match, ui_payload

        terraform_cli.create_target_current_state(
            run_info, tenant_key_main, tenant_key_target
        )
        if "return_status" in run_info and run_info["return_status"] >= 300:
            return all_tenant_config_dict, run_legacy_match, ui_payload

        terraform_cli.terraform_refresh_plan(
            run_info, tenant_key_main, tenant_key_target
        )
        if "return_status" in run_info and run_info["return_status"] >= 300:
            return all_tenant_config_dict, run_legacy_match, ui_payload

        terraform_cli.terraform_refresh_apply(
            run_info, tenant_key_main, tenant_key_target
        )
        if "return_status" in run_info and run_info["return_status"] >= 300:
            return all_tenant_config_dict, run_legacy_match, ui_payload

        terraform_cli.create_work_hcl(run_info, tenant_key_main, tenant_key_target)
        if "return_status" in run_info and run_info["return_status"] >= 300:
            return all_tenant_config_dict, run_legacy_match, ui_payload

        terraform_state.keep_state_for_IDs(
            tenant_key_main, tenant_key_target, tenant_key_main
        )

        terraform_state.merge_state_into_config(tenant_key_main, tenant_key_target)
        ui_payload, log_dict = terraform_cli.plan_all(
            run_info,
            tenant_key_main,
            tenant_key_target,
            env_var_type=terraform_cli.ENV_VAR_USE_CACHE,
        )

        if ui_payload is None:
            ui_payload = terraform_local.load_ui_payload(
                tenant_key_main, tenant_key_target
            )

    return all_tenant_config_dict, run_legacy_match, ui_payload


def copy_configs_safe_same_entity_id(
    run_info,
    context_params,
    pre_migration,
    tenant_key_target,
    matched_entities_dict,
    entities_dict,
    config_dict_main,
    config_dict_target,
):
    schemas_definitions_dict_main = process_utils.get_tenant_schemas_definitions_dict(
        run_info, is_target_tenant=False
    )
    schemas_definitions_dict_target = process_utils.get_tenant_schemas_definitions_dict(
        run_info, is_target_tenant=True
    )

    same_entity_id_index_main_to_target = index_entities_main_to_target(
        run_info, context_params, matched_entities_dict
    )

    if run_info["preemptive_config_copy"] == True:
        _, preemptive_ids = process_missing_entity_ids(
            {},
            run_info,
            config_dict_main,
            same_entity_id_index_main_to_target,
            entities_dict,
            matched_entities_dict,
        )

        compare_config_dict = compare_config_per_entity(
            run_info,
            preemptive_ids,
            schemas_definitions_dict_main,
            schemas_definitions_dict_target,
            config_dict_main,
            config_dict_target,
        )

        execute_all_configs(
            run_info, tenant_key_target, compare_config_dict, pre_migration
        )

    else:
        compare_config_dict = compare_config_per_entity(
            run_info,
            same_entity_id_index_main_to_target,
            schemas_definitions_dict_main,
            schemas_definitions_dict_target,
            config_dict_main,
            config_dict_target,
        )

        execute_all_configs(
            run_info, tenant_key_target, compare_config_dict, pre_migration
        )

    result_table = format_all_to_table(compare_config_dict)

    if run_info["preemptive_config_copy"] == True:
        pass
    else:
        result_table, _ = process_missing_entity_ids(
            result_table,
            run_info,
            config_dict_main,
            same_entity_id_index_main_to_target,
            entities_dict,
            matched_entities_dict,
        )

    return result_table


def index_entities_main_to_target(run_info, context_params, matched_entities_dict):
    same_entity_id_index_main_to_target = {}

    if run_info["unique_entity"]:
        same_entity_id_index_main_to_target = index_unique_entities(
            same_entity_id_index_main_to_target, context_params["provided_id"]
        )
    elif run_info["forced_match"]:
        same_entity_id_index_main_to_target = index_matched_entities(
            same_entity_id_index_main_to_target, matched_entities_dict
        )
    else:
        same_entity_id_index_main_to_target = index_matched_entities(
            same_entity_id_index_main_to_target, matched_entities_dict
        )

        same_entity_id_index_main_to_target = index_unique_entities(
            same_entity_id_index_main_to_target, {"environment": "environment"}
        )

    return same_entity_id_index_main_to_target


def process_missing_entity_ids(
    result_table,
    run_info,
    config_dict_main,
    same_entity_id_index_main_to_target,
    entities_dict,
    matched_entities_dict,
):
    entity_match_missing_dict = {}
    entity_match_unmatched_dict = {}
    preemptive_ids = {}
    tenant_key_main = run_info["tenant_key_main"]
    tenant_key_target = run_info["tenant_key_target"]

    add_all_missing_entities = True

    if run_info["forced_match"]:
        missing_entity_id = run_info["tenant_param_dict"][tenant_key_main]["scope"]

        if missing_entity_id == "environment":
            pass
        else:
            add_all_missing_entities = False

            (
                entity_match_missing_dict,
                entity_match_unmatched_dict,
                preemptive_ids,
            ) = validate_entity_missing(
                tenant_key_main,
                tenant_key_target,
                missing_entity_id,
                same_entity_id_index_main_to_target,
                entities_dict,
                matched_entities_dict,
                entity_match_missing_dict,
                entity_match_unmatched_dict,
                run_info["preemptive_config_copy"] == True,
                preemptive_ids,
            )

    if add_all_missing_entities:
        for missing_entity_dict in config_dict_main["entities"].values():
            for missing_entity_id in missing_entity_dict.keys():
                (
                    entity_match_missing_dict,
                    entity_match_unmatched_dict,
                    preemptive_ids,
                ) = validate_entity_missing(
                    tenant_key_main,
                    tenant_key_target,
                    missing_entity_id,
                    same_entity_id_index_main_to_target,
                    entities_dict,
                    matched_entities_dict,
                    entity_match_missing_dict,
                    entity_match_unmatched_dict,
                    run_info["preemptive_config_copy"] == True,
                    preemptive_ids,
                )

    if entity_match_missing_dict == {}:
        pass
    else:
        result_table["entity_match_missing"] = entity_match_missing_dict

    if entity_match_unmatched_dict == {}:
        pass
    else:
        result_table[
            "entity_match_unmatched_dict"
        ] = process_match_entities.convert_matched_to_tree(entity_match_unmatched_dict)

    return result_table, preemptive_ids


def validate_entity_missing(
    tenant_key_main,
    tenant_key_target,
    missing_entity_id,
    same_entity_id_index_main_to_target,
    entities_dict,
    matched_entities_dict,
    entity_match_missing_dict,
    entity_match_unmatched_dict,
    doProcessPreemptive,
    preemptive_ids,
):
    if missing_entity_id in same_entity_id_index_main_to_target:
        pass
    else:
        missing_entity_type = entity_utils.extract_type_from_entity_id(
            missing_entity_id
        )

        if missing_entity_id in entities_dict[tenant_key_main]:
            if (
                missing_entity_type in matched_entities_dict
                and missing_entity_id in matched_entities_dict[missing_entity_type]
            ):
                if missing_entity_type in entity_match_unmatched_dict:
                    pass
                else:
                    entity_match_unmatched_dict[missing_entity_type] = {}

                entity_match_unmatched_dict[missing_entity_type][
                    missing_entity_id
                ] = matched_entities_dict[missing_entity_type][missing_entity_id]

                if doProcessPreemptive:
                    preemptive_ids = add_preemptive_id(
                        tenant_key_target,
                        entities_dict,
                        missing_entity_type,
                        missing_entity_id,
                        preemptive_ids,
                    )

            else:
                entity_match_missing_dict[missing_entity_id] = ""

                if doProcessPreemptive:
                    preemptive_ids = add_preemptive_id(
                        tenant_key_target,
                        entities_dict,
                        missing_entity_type,
                        missing_entity_id,
                        preemptive_ids,
                    )
        else:
            entity_match_missing_dict[missing_entity_id] = ""

            if doProcessPreemptive:
                preemptive_ids = add_preemptive_id(
                    tenant_key_target,
                    entities_dict,
                    missing_entity_type,
                    missing_entity_id,
                    preemptive_ids,
                )

    return entity_match_missing_dict, entity_match_unmatched_dict, preemptive_ids


def add_preemptive_id(
    tenant_key_target,
    entities_dict,
    missing_entity_type,
    missing_entity_id,
    preemptive_ids,
):
    if missing_entity_id in entities_dict[tenant_key_target]:
        pass
    else:
        preemptive_ids[missing_entity_id] = (missing_entity_type, missing_entity_id)

    return preemptive_ids


def compare_config_per_entity(
    run_info,
    same_entity_id_index_main_to_target,
    schemas_definitions_dict_main,
    schemas_definitions_dict_target,
    config_dict_main,
    config_dict_target,
):
    compare_config_dict = {}

    for (
        entity_id_main,
        entity_keys_target,
    ) in same_entity_id_index_main_to_target.items():
        entity_type, entity_id_target = entity_keys_target

        compare_config_dict = compare_config(
            run_info,
            entity_type,
            schemas_definitions_dict_main,
            schemas_definitions_dict_target,
            compare_config_dict,
            config_dict_main,
            entity_id_main,
            config_dict_target,
            entity_id_target,
        )

    return compare_config_dict


def execute_all_configs(run_info, tenant_key_target, config_dict, pre_migration):
    action_function_map = {
        ACTION_ADD: add_config,
        ACTION_PREEMPTIVE: add_config,
        ACTION_DELETE: delete_config,
        ACTION_UPDATE: update_config,
    }

    api_config = credentials.get_api_call_credentials(tenant_key_target)

    for schema_config_dict in config_dict.values():
        for config_id, config_dict in schema_config_dict.items():
            if config_dict["error"] == True:
                pass
            else:
                action = config_dict["action"]

                if action in action_function_map:
                    action_function = action_function_map[action]
                    try:
                        action_function(
                            api_config, config_id, config_dict, pre_migration
                        )

                    except SettingsValidationError as err:
                        process_utils.add_config_aggregate_error(
                            run_info, config_dict, err
                        )
                    except err:
                        process_utils.add_aggregate_error(
                            run_info,
                            process_utils.build_config_aggregate_error_msg(
                                config_dict, err
                            ),
                        )


def format_all_to_table(compare_config_dict, result_table=None):
    if result_table is None:
        result_table = {
            "legend": {
                "status": {
                    ACTION_DELETE: "D",
                    ACTION_ADD: "A",
                    ACTION_UPDATE: "U",
                    ACTION_IDENTICAL: "I",
                    ACTION_PREEMPTIVE: "P",
                    "multi_ordered": "O",
                    "key_not_found": "F",
                    "multi_matched": "M",
                    "multi_matched_key_id": "K",
                    "scope_isn_t_entity": "S",
                    "management_zone": "Z",
                }
            },
            "entities": {},
        }

    result_table = format_all_configs(compare_config_dict, result_table, error=True)
    result_table = format_all_configs(compare_config_dict, result_table, error=False)

    return result_table


def flatten_results(result_table):
    if "entities" in result_table:
        for entity_type in result_table["entities"].keys():
            type_dict = result_table["entities"][entity_type]
            result_table["entities"][entity_type] = {"items": list(type_dict.values())}

    return result_table


def format_all_configs(all_config_dict, result_table, error):
    key_id_incr_dict = {}

    sorted_schema_list = sort_schemas(all_config_dict, error)

    for schema_id in sorted_schema_list:
        schema_dict = all_config_dict[schema_id]
        sorted_config_dict = sort_configs(schema_dict, error)

        for config_id in sorted_config_dict:
            config_dict = schema_dict[config_id]

            if config_dict["error"] == error:
                result_table = format_to_table(
                    config_dict, result_table, key_id_incr_dict
                )

    return result_table


def sort_schemas(all_config_dict, error):
    value_schema_dict = {}

    schema_list = all_config_dict.keys()

    for schema_id in schema_list:
        value_schema_dict[schema_id] = 0.0

        for config_dict in all_config_dict[schema_id].values():
            value_schema_dict[schema_id] += get_sort_value(config_dict, error)

    return dict_to_sorted_list(value_schema_dict)


def sort_configs(schema_dict, error):
    value_config_dict = {}

    for config_id, config_dict in schema_dict.items():
        value_config_dict[config_id] = get_sort_value(config_dict, error)

    return dict_to_sorted_list(value_config_dict)


def get_sort_value(config_dict, error):
    value = 0.0

    if config_dict["error"] == error:
        if config_dict["action"] == ACTION_IDENTICAL:
            value += 0.0001
        else:
            value += 1.0

    return round(value, 4)


def dict_to_sorted_list(sorted_dict):
    sorted_dict = dict(
        sorted(sorted_dict.items(), key=lambda item: item[1], reverse=True)
    )

    return list(sorted_dict.keys())


def format_to_table(config_dict, result_table, key_id_incr_dict):
    entity_id_dict = config_dict["entity_id_dict"]

    entity_id_main = entity_id_dict["from"]
    entity_id_target = entity_id_dict["to"]

    action = config_dict["action"]

    entity_type = config_dict["type"]

    decorated_entity_type = entity_type
    if config_dict["error"] == True:
        decorated_entity_type = "OUPS... NOT SUPPORTED YET: " + decorated_entity_type

    schema_id = config_dict["schema_id"]

    is_unique_entity = False
    row_key = entity_id_target
    key_id = config_dict["key_id"]
    expected_unicity_column = "from"

    if entity_id_target in process_utils.UNIQUE_ENTITY_LIST:
        is_unique_entity = True
        expected_unicity_column = "scope"
        row_key = entity_id_target + "_" + schema_id

    if decorated_entity_type in result_table["entities"]:
        pass
    else:
        result_table["entities"][decorated_entity_type] = {}
        if is_unique_entity:
            pass
        else:
            result_table["legend"][decorated_entity_type] = {"id": 0, "schemas": {}}

    if row_key in result_table["entities"][decorated_entity_type]:
        pass

    else:
        if is_unique_entity:
            result_table["entities"][decorated_entity_type][row_key] = {
                "scope": entity_id_target,
                "schemaId": schema_id,
            }
        else:
            result_table["entities"][decorated_entity_type][row_key] = {
                "to": entity_id_target,
                "from": entity_id_main,
            }

    status_label = ""

    if config_dict["identical"]:
        pass
    else:
        status_label = result_table["legend"]["status"][action]

    if "status" in config_dict:
        for status_val in config_dict["status"]:
            if status_label == "":
                pass
            else:
                status_label += ","
            status_label += result_table["legend"]["status"][status_val]

    result_table["entities"][decorated_entity_type][row_key][
        "unique"
    ] = is_unique_entity

    column_key = ""

    if row_key in key_id_incr_dict:
        pass
    else:
        key_id_incr_dict[row_key] = {"id": 0, "key_ids": {}}

    if key_id in key_id_incr_dict[row_key]["key_ids"]:
        pass
    else:
        key_id_incr_dict[row_key]["key_ids"][key_id] = key_id_incr_dict[row_key]["id"]
        key_id_incr_dict[row_key]["id"] += 1

    column_key += str(key_id_incr_dict[row_key]["key_ids"][key_id])

    if is_unique_entity:
        pass
    else:
        if schema_id in result_table["legend"][decorated_entity_type]["schemas"]:
            pass
        else:
            result_table["legend"][decorated_entity_type]["schemas"][schema_id] = str(
                result_table["legend"][decorated_entity_type]["id"]
            )
            result_table["legend"][decorated_entity_type]["id"] += 1

        column_key += "[S:"
        column_key += result_table["legend"][decorated_entity_type]["schemas"][
            schema_id
        ]
        column_key += "]"

    if column_key in result_table["entities"][decorated_entity_type][row_key]:
        if (
            entity_id_main
            == result_table["entities"][decorated_entity_type][row_key][
                expected_unicity_column
            ]
        ):
            print("3 MAYBE... ERROR: Multiple sources for a single column of entity??")
            # pass
        else:
            print("4 ERROR: Multiple sources for a single column of entity??")
            return

    result_table["entities"][decorated_entity_type][row_key][column_key] = status_label

    if "data" in result_table["entities"][decorated_entity_type][row_key]:
        pass
    else:
        result_table["entities"][decorated_entity_type][row_key]["data"] = {}

    if column_key in result_table["entities"][decorated_entity_type][row_key]["data"]:
        pass
    else:
        result_table["entities"][decorated_entity_type][row_key]["data"][column_key] = {
            "status": status_label
        }

    if is_unique_entity:
        pass
    else:
        result_table["entities"][decorated_entity_type][row_key]["data"][column_key][
            "schemaId"
        ] = schema_id

    if key_id == "":
        pass
    else:
        result_table["entities"][decorated_entity_type][row_key]["data"][column_key][
            "key_id"
        ] = key_id

    if "main" in config_dict:
        result_table["entities"][decorated_entity_type][row_key]["data"][column_key][
            "data_main"
        ] = json.dumps(config_dict["main"])
    if "target" in config_dict:
        result_table["entities"][decorated_entity_type][row_key]["data"][column_key][
            "data_target"
        ] = json.dumps(config_dict["target"])

    if "entity_list" in config_dict:
        result_table["entities"][decorated_entity_type][row_key]["data"][column_key][
            "entity_list"
        ] = json.dumps(config_dict["entity_list"])

    return result_table


def add_error_message(result_table, message):
    if result_table is None:
        result_table = {}

    if "errors" in result_table:
        pass
    else:
        result_table["errors"] = []

    result_table["errors"].append(message)

    return result_table


def delete_config(api_config, config_id, config_dict, pre_migration):
    print("\n", "delete: ", config_id)
    url_trail = "/" + config_id

    if pre_migration:
        pass
    else:
        response = api_v2.delete(
            api_config, api_v2.settings_objects, url_trail, skip_404=False
        )

        print(response)


def add_config(api_config, config_id, config_dict, pre_migration):
    payload = gen_target_payload(config_dict, "main")

    url_trail = ""

    print("\n", "add: ", config_id, payload)

    if pre_migration:
        pass
    else:
        response = api_v2.post(
            api_config,
            api_v2.settings_objects,
            url_trail,
            json.dumps([payload]),
            skip_404=False,
        )

        print(response)


def update_config(api_config, config_id, config_dict, pre_migration):
    payload = gen_target_payload(config_dict, "main")

    url_trail = "/" + config_dict["target"]["objectId"]

    print("\n", "update: ", url_trail, config_id, payload)

    if pre_migration:
        pass
    else:
        response = api_v2.put(
            api_config,
            api_v2.settings_objects,
            url_trail,
            json.dumps(payload),
            skip_404=False,
        )

        print(response)


def gen_target_payload(config_dict, config_tenant_type):
    config_dict_replaced = replace_entities(config_dict, config_tenant_type)
    payload = {
        "schemaId": config_dict[config_tenant_type]["schemaId"],
        "scope": config_dict_replaced["scope"],
        "value": config_dict_replaced["value"],
    }

    if "schemaVersion" in config_dict[config_tenant_type]:
        payload["schemaVersion"] = config_dict[config_tenant_type]["schemaVersion"]

    return payload


def replace_entities(config_dict, config_tenant_type):
    entity_id_dict = config_dict["entity_id_dict"]

    config_dict_target = config_dict[config_tenant_type]
    config_str = json.dumps(config_dict_target)
    config_str_replaced = config_str.replace(
        entity_id_dict["from"], entity_id_dict["to"]
    )
    config_dict_replaced = json.loads(config_str_replaced)

    return config_dict_replaced


def get_sorted_key_list(input_main, current_key=None):
    keys_dict = None
    if current_key is None:
        keys_dict = input_main

    elif current_key in input_main:
        keys_dict = input_main[current_key]

    if keys_dict is None:
        return []
    else:
        key_list = list(keys_dict.keys())
        key_list.sort()

        return key_list


def get_sorted_key_merged_list(input_main, input_target, current_key=None):
    list_main = get_sorted_key_list(input_main, current_key)
    list_target = get_sorted_key_list(input_target, current_key)

    sorted_schema_merged_list = compare.merge_lists(list_main, list_target)

    return sorted_schema_merged_list


def extract_entity_dict(config_dict, entity_type, schema_id, entity_id):
    entity_dict = {}

    try:
        schema_dict = config_dict["entity_config_index"][entity_type][schema_id]

        _, entity_dict = extract_key_id_dict(schema_dict, entity_id)

    except KeyError:
        pass

    return entity_dict


def extract_key_id_dict(entity_dict, key_id):
    key_id_in = False
    key_id_dict = {}

    if key_id in entity_dict:
        key_id_in = True
        key_id_dict = entity_dict[key_id]

    return key_id_in, key_id_dict


def compare_config(
    run_info,
    entity_type,
    schemas_definitions_dict_main,
    schemas_definitions_dict_target,
    compare_config_dict,
    config_dict_main,
    entity_id_main,
    config_dict_target,
    entity_id_target,
):
    sorted_schema_merged_list = get_sorted_key_merged_list(
        config_dict_main["entity_config_index"],
        config_dict_target["entity_config_index"],
        entity_type,
    )

    for schema_id in sorted_schema_merged_list:
        entity_dict_main = extract_entity_dict(
            config_dict_main, entity_type, schema_id, entity_id_main
        )
        entity_dict_target = extract_entity_dict(
            config_dict_target, entity_type, schema_id, entity_id_target
        )

        sorted_config_key_id_merged_list = get_sorted_key_merged_list(
            entity_dict_main, entity_dict_target
        )

        for key_id in sorted_config_key_id_merged_list:
            is_key_id_in_main, config_list_main = extract_key_id_dict(
                entity_dict_main, key_id
            )
            is_key_id_in_target, config_list_target = extract_key_id_dict(
                entity_dict_target, key_id
            )

            entity_id_dict = {"from": entity_id_main, "to": entity_id_target}

            error_id_list = []

            if (
                schema_id in schemas_definitions_dict_main["ordered_schemas"]
                or schema_id in schemas_definitions_dict_target["ordered_schemas"]
            ):
                process_utils.set_warning_message(
                    run_info,
                    "Ordered Settings will be handled, but they will NOT be reordered to reflect the source tenant order. In most cases, the order doesn't matter and copying them will deliver good results.",
                )

            if (
                schema_id in config_dict_main["key_not_found_schemas"]
                or schema_id in config_dict_target["key_not_found_schemas"]
            ):
                error_id_list.append("key_not_found")

            if (
                schema_id in config_dict_main["multi_matched_schemas"]
                or schema_id in config_dict_target["multi_matched_schemas"]
            ):
                error_id_list.append("multi_matched")

            if is_key_id_in_main and is_key_id_in_target:
                compare_config_dict = create_update_configs(
                    run_info,
                    compare_config_dict,
                    entity_type,
                    schema_id,
                    key_id,
                    entity_id_dict,
                    error_id_list,
                    config_dict_main,
                    config_list_main,
                    config_dict_target,
                    config_list_target,
                )
            elif is_key_id_in_target:
                compare_config_dict, entity_accepted = add_configs(
                    run_info,
                    compare_config_dict,
                    ACTION_DELETE,
                    entity_type,
                    schema_id,
                    key_id,
                    "target",
                    config_list_target[0],
                    config_list_target,
                    config_dict_target,
                    entity_id_dict,
                    error_id_list=error_id_list,
                )

            elif is_key_id_in_main:
                action = ACTION_ADD
                if run_info["preemptive_config_copy"]:
                    action = ACTION_PREEMPTIVE
                compare_config_dict, entity_accepted = add_configs(
                    run_info,
                    compare_config_dict,
                    action,
                    entity_type,
                    schema_id,
                    key_id,
                    "main",
                    config_list_main[0],
                    config_list_main,
                    config_dict_main,
                    entity_id_dict,
                    error_id_list=error_id_list,
                )

    return compare_config_dict


def create_update_configs(
    run_info,
    compare_config_dict,
    entity_type,
    schema_id,
    key_id,
    entity_id_dict,
    error_id_list,
    config_dict_main,
    config_list_main,
    config_dict_target,
    config_list_target,
):
    main_config_id = config_list_main[0]
    target_config_id = config_list_target[0]

    is_deeply_different = compare.is_deeply_different(
        config_dict_target["configs"][target_config_id]["value"],
        config_dict_main["configs"][main_config_id]["value"],
    )

    identical = True
    action = ACTION_IDENTICAL
    if is_deeply_different:
        identical = False
        action = ACTION_UPDATE

    compare_config_dict, entity_accepted = add_configs(
        run_info,
        compare_config_dict,
        action,
        entity_type,
        schema_id,
        key_id,
        "target",
        target_config_id,
        config_list_target,
        config_dict_target,
        entity_id_dict,
        identical,
        error_id_list,
    )
    compare_config_dict, entity_accepted = add_configs(
        run_info,
        compare_config_dict,
        action,
        entity_type,
        schema_id,
        key_id,
        "main",
        target_config_id,
        config_list_main,
        config_dict_main,
        identical=identical,
        error_id_list=error_id_list,
    )

    return compare_config_dict


def add_configs(
    run_info,
    config_dict,
    action,
    entity_type,
    schema_id,
    key_id,
    config_tenant_type,
    current_config_id,
    config_list,
    tenant_config_dict,
    entity_id_dict=None,
    identical=False,
    error_id_list=[],
):
    entity_accepted = False

    if process_utils.is_filtered_out_action(run_info, action):
        return config_dict, entity_accepted

    object_id = config_list[0]

    # For multi entity present in config, prioritize the entity perception over the global perception
    if entity_type in process_utils.UNIQUE_ENTITY_LIST:
        try:
            if (
                config_dict[schema_id][current_config_id]["type"]
                in process_utils.UNIQUE_ENTITY_LIST
            ):
                pass
            elif config_dict[schema_id][current_config_id]["type"] == "":
                pass
            else:
                return config_dict, entity_accepted
        except (KeyError, TypeError):
            pass

    # Base Code to match config per entity & multi entity per config
    if "multi_matched" in error_id_list:
        pass
    elif object_id in tenant_config_dict["multi_matched_objects"]:
        error_id_list.append("multi_matched")

    elif len(config_list) > 1:
        print(
            "TODO: Deal with multi config per entity & multi entity per config",
            "\n",
            schema_id,
            config_list,
            entity_id_dict,
        )
        error_id_list.append("multi_matched")

    if "multi_matched_key_id" in error_id_list:
        pass
    elif object_id in tenant_config_dict["multi_matched_key_id_object"]:
        error_id_list.append("multi_matched_key_id")

    if object_id in tenant_config_dict["management_zone_objects"]:
        error_id_list.append("management_zone")

    if schema_id in config_dict:
        pass
    else:
        config_dict[schema_id] = {}

    if current_config_id in config_dict[schema_id]:
        if entity_id_dict is None:
            pass
        else:
            if "multi_matched" in error_id_list:
                pass
            else:
                print(
                    "Current Config Id already added to the list: ",
                    schema_id,
                    current_config_id,
                    "\n",
                    config_dict[schema_id][current_config_id],
                )
                error_id_list.append("multi_matched")
    else:
        config_dict[schema_id][current_config_id] = {
            "status": [],
            "error": False,
            "action": action,
        }

    config_dict[schema_id][current_config_id][config_tenant_type] = tenant_config_dict[
        "configs"
    ][object_id]

    if entity_id_dict is None:
        pass
    else:
        config_dict[schema_id][current_config_id]["entity_id_dict"] = entity_id_dict

    config_dict[schema_id][current_config_id]["identical"] = identical
    if identical == True:
        config_dict[schema_id][current_config_id]["status"] = add_status_to_list(
            config_dict[schema_id][current_config_id]["status"], ACTION_IDENTICAL
        )

    config_dict[schema_id][current_config_id]["type"] = entity_type
    config_dict[schema_id][current_config_id]["schema_id"] = schema_id
    config_dict[schema_id][current_config_id]["key_id"] = key_id

    if (
        entity_id_dict is not None
        and "scope" in tenant_config_dict["configs"][object_id]
    ):
        # TODO: Deal with multi config per entity & multi entity per config

        if (
            tenant_config_dict["configs"][object_id]["scope"] == entity_id_dict["from"]
            or tenant_config_dict["configs"][object_id]["scope"] == entity_id_dict["to"]
        ):
            pass
        else:
            config_dict[schema_id][current_config_id]["error"] = True
            config_dict[schema_id][current_config_id]["status"] = add_status_to_list(
                config_dict[schema_id][current_config_id]["status"],
                "scope_isn_t_entity",
            )

            # print("ERROR: Scope isn't the entity: ", tenant_config_dict['configs'][object_id]
            #      ['scope'], tenant_config_dict['configs'][object_id]['schemaId'], error_id_list)

        if object_id in tenant_config_dict["config_entity_index"]:
            config_dict[schema_id][current_config_id]["entity_list"] = list(
                tenant_config_dict["config_entity_index"][object_id].keys()
            )

    for error_id in error_id_list:
        config_dict[schema_id][current_config_id]["error"] = True
        config_dict[schema_id][current_config_id]["status"] = add_status_to_list(
            config_dict[schema_id][current_config_id]["status"], error_id
        )

    entity_accepted = True

    return config_dict, entity_accepted


def add_status_to_list(status_list, status):
    if status in status_list:
        pass
    else:
        status_list.append(status)

    return status_list


def index_matched_entities(same_entity_id_index, matched_entities_dict):
    duplicate_source_target_dict = {}

    for entity_type in matched_entities_dict.keys():
        for entity_id_main in matched_entities_dict[entity_type].keys():
            for matched_entity_id in matched_entities_dict[entity_type][entity_id_main][
                "match_entity_list"
            ].keys():
                if (
                    "only_top_match"
                    in matched_entities_dict[entity_type][entity_id_main][
                        "match_entity_list"
                    ][matched_entity_id]
                    or "forced_match"
                    in matched_entities_dict[entity_type][entity_id_main][
                        "match_entity_list"
                    ][matched_entity_id]
                ):
                    if matched_entity_id in duplicate_source_target_dict:
                        first_main_found_for_target_entity_id = (
                            duplicate_source_target_dict[matched_entity_id]
                        )

                        # TODO Add some code to handle these multi source entity to single target entity
                        # Give a clue to the users about this problem happening, not only a console log
                        print(
                            "Duplicate Entity Match (multiple sources for 1 target entity): ",
                            "Target: ",
                            matched_entity_id,
                            "      Main: ",
                            entity_id_main,
                            "\n",
                            "                       ",
                            "Target: ",
                            matched_entity_id,
                            "First Main: ",
                            first_main_found_for_target_entity_id,
                        )

                        if (
                            first_main_found_for_target_entity_id
                            in same_entity_id_index
                        ):
                            del same_entity_id_index[
                                first_main_found_for_target_entity_id
                            ]

                        continue
                    else:
                        duplicate_source_target_dict[matched_entity_id] = entity_id_main

                    same_entity_id_index[entity_id_main] = (
                        entity_type,
                        matched_entity_id,
                    )

    return same_entity_id_index


def index_unique_entities(same_entity_id_index, provided_id):
    for entity_id_target, entity_id_main in provided_id.items():
        if entity_id_main == entity_id_target:
            same_entity_id_index[entity_id_main] = (entity_id_target, entity_id_target)

        else:
            print("ERROR: Unique Entity IDs should be identical on both sides")

    return same_entity_id_index
