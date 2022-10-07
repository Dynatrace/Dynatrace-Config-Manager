from main_server import app
from flask import Flask, request, jsonify
from flask_cors import cross_origin
import json
import config_v2
from filter import AnalysisFilter
import handler_api
import flask_utils
import process_match_entities
import process_match_config
from process_analysis import ScopeTypeAnalysis


@app.route('/analyze_config_v2', methods=['POST'])
@cross_origin(origin='*')
def analyze_config_v2():
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    analysis_object = ScopeTypeAnalysis()

    done = handler_api.analyze(
        tenant_key, config_v2.extract_function, analysis_object)

    response = app.response_class(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/match_entities_v2', methods=['GET'])
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
    #active_rules = flask_utils.get_arg_json('active_rules'. ['6'])
    #context_params = flask_utils.get_arg_json('context_params',{'provided_id': {'HOST-4CF7798838A2AFA7': 'HOST-49EB5C70CCC72E0E'}})

    analysis_filter = AnalysisFilter(entity_filter, time_from, time_to)
    #analysis_filter = AnalysisFilter(entity_filter, 1663348592101, 1663598408747)

    result = process_match_entities.match_entities_tree(
        tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params)

    response = app.response_class(
        response=json.dumps(result),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/match_config_v2', methods=['GET'])
@cross_origin(origin='*')
def match_config_v2():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = ['HOST', 'HOST_GROUP',
                     'PROCESS_GROUP', 'SERVICE', 'APPLICATION']

    result = process_match_config.match_config(
        tenant_key_main, tenant_key_target, entity_filter)

    response = app.response_class(
        response=json.dumps(result),
        status=200,
        mimetype='application/json'
    )

    return response
