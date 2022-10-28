from main_server import app
from flask import Flask, request, jsonify
from flask_cors import cross_origin
import json
import settings_2_0
import settings_2_0_schemas
import entity_v2
import handler_api
import flask_utils


@app.route('/extract_settings_2_0', methods=['POST'])
@cross_origin(origin='*')
def extract_settings_2_0():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    done = handler_api.pull(tenant_key, settings_2_0_schemas.extract_function, use_cache)
    done = handler_api.pull(tenant_key, settings_2_0.extract_function, use_cache)

    response = app.response_class(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response

@app.route('/extract_settings_2_0_scope', methods=['POST'])
@cross_origin(origin='*')
def extract_settings_2_0_scope():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')
    scope = flask_utils.get_arg('scope', 'HOST-4CF7798838A2AFA7')

    done = handler_api.pull(tenant_key, settings_2_0.extract_specific_scope, use_cache, input_params=scope)

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
