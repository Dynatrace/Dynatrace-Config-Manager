from flask import Flask, request, Blueprint
from flask_cors import cross_origin
import flask_utils
from deepdiff import DeepDiff
import monaco_cli_download
import monaco_cli_match
import monaco_local_entity
import process_match_entities
import process_migrate_config
import process_utils
import response_utils

blueprint_route_monaco = Blueprint('blueprint_route_monaco', __name__)


@blueprint_route_monaco.route('/monaco_test_extract_entities', methods=['GET'])
@cross_origin(origin='*')
def monaco_test_extract_entities():

    tenant_key = flask_utils.get_arg('tenant_key', '0')
    run_info = {'aggregate_error': [], 'return_status': 200}
    print(run_info)

    def call_process():
        monaco_list = monaco_cli_download.extract_entities(
            run_info, tenant_key)
        return monaco_list

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_monaco.route('/monaco_test_match_entities', methods=['GET'])
@cross_origin(origin='*')
def monaco_test_match_entities():

    tenant_key = flask_utils.get_arg('tenant_key', '0')
    run_info = {'aggregate_error': [], 'return_status': 200}
    print(run_info)

    def call_process():
        monaco_list = monaco_cli_match.match_entities(run_info, tenant_key)
        return monaco_list

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_monaco.route('/monaco_test_load_matched_entities', methods=['GET'])
@cross_origin(origin='*')
def monaco_test_load_matched_entities():

    tenant_key = flask_utils.get_arg('tenant_key', '0')
    run_info = {'aggregate_error': [], 'return_status': 200}
    print(run_info)

    def call_process():
        must_rerun, monaco_list = monaco_local_entity.load_matched_entities(
            tenant_key)
        return monaco_list

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_monaco.route('/monaco_test_compare_match_sources', methods=['POST'])
@cross_origin(origin='*')
def monaco_test_compare_match_sources():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             process_utils.ALL_BASIC_ENTITY_LIST)
    active_rules = flask_utils.get_arg_json('active_rules')
    forced_entity_id_main = flask_utils.get_arg('forced_entity_id_main')
    forced_entity_id_target = flask_utils.get_arg('forced_entity_id_target')
    forced_schema_id = flask_utils.get_arg('forced_schema_id')
    forced_key_id = flask_utils.get_arg('forced_key_id')
    forced_keep_action_only = flask_utils.get_arg_json(
        'forced_keep_action_only')
    context_params = flask_utils.get_arg_json('context_params')
    use_environment_cache = flask_utils.get_arg_bool(
        'use_environment_cache', False)
    preemptive_config_copy = flask_utils.get_arg_bool(
        'preemptive_config_copy', False)
    pre_migration = flask_utils.get_arg_bool('pre_migration', True)

    run_info = process_utils.get_run_info(
        tenant_key_main, tenant_key_target, context_params, entity_filter, use_environment_cache=use_environment_cache,
        forced_entity_idforced_entity_id_main=forced_entity_id_main, forced_entity_id_target=forced_entity_id_target, forced_schema_id=forced_schema_id, forced_key_id=forced_key_id,
        forced_keep_action_only=forced_keep_action_only, preemptive_config_copy=preemptive_config_copy)

    def call_process():
        matched_entities_dict_legacy, _ = process_match_entities.get_entities_dict(
            run_info, active_rules, context_params)
        same_entity_id_index_main_to_target_legacy = process_migrate_config.index_entities_main_to_target(
            run_info, context_params, matched_entities_dict_legacy)

        _, matched_entities_dict_monaco, _ = monaco_cli_match.try_monaco_match(
            run_info, tenant_key_main, tenant_key_target)
        same_entity_id_index_main_to_target_monaco = process_migrate_config.index_entities_main_to_target(
            run_info, context_params, matched_entities_dict_monaco)

        ddiff = DeepDiff(same_entity_id_index_main_to_target_monaco,
                         same_entity_id_index_main_to_target_legacy, ignore_order=True)

        return {
            'identical': (ddiff == {}),
            'monaco': same_entity_id_index_main_to_target_monaco,
            'legacy': same_entity_id_index_main_to_target_legacy,
        }

    return response_utils.call_and_get_response(call_process, run_info)
