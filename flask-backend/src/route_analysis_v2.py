from flask import Flask, Blueprint
from flask_cors import cross_origin
import settings_2_0
from filter import AnalysisFilter
import handler_api
import flask_utils
import process_match_entities
import process_match_settings_2_0
from process_analysis import ScopeTypeAnalysis
import process_utils
import response_utils

blueprint_route_analysis_v2 = Blueprint(
    'blueprint_route_analysis_v2', __name__)


@blueprint_route_analysis_v2.route('/analyze_settings_2_0', methods=['POST'])
@cross_origin(origin='*')
def analyze_settings_2_0():
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    def call_process():
        analysis_object = ScopeTypeAnalysis()

        done = handler_api.analyze(
            tenant_key, settings_2_0.extract_function, analysis_object)
        return done

    return response_utils.call_and_get_response(call_process)


@blueprint_route_analysis_v2.route('/match_entities_v2', methods=['GET'])
@cross_origin(origin='*')
def match_entities_v2():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    time_from = flask_utils.get_arg_int('time_from')
    time_to = flask_utils.get_arg_int('time_to')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             ['HOST', 'HOST_GROUP',
                                              'PROCESS_GROUP', 'SERVICE', 'APPLICATION'])
    active_rules = flask_utils.get_arg_json('active_rules')
    context_params = flask_utils.get_arg_json('context_params')
    # active_rules = flask_utils.get_arg_json('active_rules'. ['6'])
    #context_params = flask_utils.get_arg_json('context_params',{'provided_id': {'HOST-4CF7798838A2AFA7': 'HOST-49EB5C70CCC72E0E'}})

    analysis_filter = AnalysisFilter(entity_filter, time_from, time_to)
    #analysis_filter = AnalysisFilter(entity_filter, 1663348592101, 1663598408747)

    run_info = process_utils.get_run_info(
        tenant_key_main, tenant_key_target, context_params, entity_filter)

    def call_process():
        analysis_filter = run_info['analysis_filter']

        result = process_match_entities.match_entities_tree(
            run_info, analysis_filter, active_rules, context_params)
        return result

    return response_utils.call_and_get_response(call_process)


@blueprint_route_analysis_v2.route('/match_settings_2_0', methods=['GET'])
@cross_origin(origin='*')
def match_settings_2_0():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = ['HOST', 'HOST_GROUP',
                     'PROCESS_GROUP', 'SERVICE', 'APPLICATION']

    def call_process():
        result = process_match_settings_2_0.match_config(
            tenant_key_main, tenant_key_target, entity_filter)
        return result

    return response_utils.call_and_get_response(call_process)
