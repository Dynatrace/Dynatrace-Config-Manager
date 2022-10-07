from main_server import app
from flask import Flask, request, jsonify
from flask_cors import cross_origin
import json
import config_v2
import entity_v2
import handler_api
import flask_utils
from process_analysis import ScopeAnalysis, ScopeTypeAnalysis


@app.route('/extract_config_v2', methods=['POST'])
@cross_origin(origin='*')
def extract_config_v2():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    done = handler_api.pull(tenant_key, config_v2.extract_function, use_cache)

    response = app.response_class(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response

@app.route('/extract_config_v2_scope', methods=['POST'])
@cross_origin(origin='*')
def extract_config_v2_scope():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')
    scope = flask_utils.get_arg('scope', 'HOST-4CF7798838A2AFA7')

    done = handler_api.pull(tenant_key, config_v2.extract_specific_scope, use_cache, input_params=scope)

    response = app.response_class(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/extract_entity_v2', methods=['POST'])
@cross_origin(origin='*')
def extract_entity_v2():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    done = handler_api.pull(tenant_key, entity_v2.extract_function, use_cache)

    response = app.response_class(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response
