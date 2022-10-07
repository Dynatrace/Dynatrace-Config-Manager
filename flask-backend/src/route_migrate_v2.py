from main_server import app
from flask import Flask, request, jsonify
from flask_cors import cross_origin
import json
import flask_utils
import process_migrate_config
import ui_api_entity_config
from filter import AnalysisFilter


@app.route('/migrate_config_v2', methods=['GET'])
@cross_origin(origin='*')
def migrate_config_v2():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             ['HOST', 'HOST_GROUP',
                                              'PROCESS_GROUP', 'SERVICE', 'APPLICATION'])
    active_rules = flask_utils.get_arg_json('active_rules')
    context_params = flask_utils.get_arg_json('context_params')
    pre_migration = flask_utils.get_arg_bool('pre_migration', True)
    analysis_filter = AnalysisFilter(entity_filter)

    result = process_migrate_config.migrate_config(
        tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params, pre_migration)

    response = app.response_class(
        response=json.dumps(result),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/migrate_ui_api_entity', methods=['POST'])
@cross_origin(origin='*')
def migrate_ui_api_entity():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             ['HOST', 'HOST_GROUP',
                                              'PROCESS_GROUP', 'SERVICE', 'APPLICATION'])
    active_rules = flask_utils.get_arg_json('active_rules')
    context_params = flask_utils.get_arg_json('context_params')
    pre_migration = flask_utils.get_arg_bool('pre_migration', True)

    done = ui_api_entity_config.copy_entity(
        tenant_key_main, tenant_key_target, context_params)
    
    print(done)

    response = app.response_class(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response
