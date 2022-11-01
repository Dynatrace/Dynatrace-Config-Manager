from flask import Flask, request, jsonify, Blueprint, Response
from flask_cors import cross_origin
import json
import flask_utils
import process_migrate_config
import ui_api_entity_config
from credentials import RequestHeadersMissingError
import process_utils

blueprint_route_migrate_v2 = Blueprint('blueprint_route_migrate_v2', __name__)

@blueprint_route_migrate_v2.route('/migrate_settings_2_0', methods=['GET'])
@cross_origin(origin='*')
def migrate_settings_2_0():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             ['HOST', 'HOST_GROUP',
                                              'PROCESS_GROUP', 'SERVICE', 'APPLICATION'])
    active_rules = flask_utils.get_arg_json('active_rules')
    context_params = flask_utils.get_arg_json('context_params')
    pre_migration = flask_utils.get_arg_bool('pre_migration', True)

    result = None
    return_status = 200
    
    run_info = process_utils.get_run_info(tenant_key_main, tenant_key_target, context_params, entity_filter)
    analysis_filter = run_info['analysis_filter']
    
    try:
        result = process_migrate_config.migrate_config(run_info, 
            tenant_key_main, tenant_key_target, analysis_filter, active_rules, context_params, pre_migration)
    except (RequestHeadersMissingError, OverflowError) as err:
        result = {"error": str(err)}
        return_status = 400

    response = Response(
        response=json.dumps(result),
        status=return_status,
        mimetype='application/json'
    )

    return response


@blueprint_route_migrate_v2.route('/migrate_ui_api_entity', methods=['POST'])
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

    run_info = process_utils.get_run_info(tenant_key_main, tenant_key_target, context_params, entity_filter)
    analysis_filter = run_info['analysis_filter']

    done = ui_api_entity_config.copy_entity(
        run_info)

    response = Response(
        response=json.dumps(done),
        status=200,
        mimetype='application/json'
    )

    return response
