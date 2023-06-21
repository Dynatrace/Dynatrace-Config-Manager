from flask import Flask, Blueprint
from flask_cors import cross_origin
import credentials
import entity_v2
import flask_utils
import handler_api
import process_utils
import response_utils
import settings_2_0
import settings_2_0_schemas

blueprint_route_extract_v2 = Blueprint('blueprint_route_extract_v2', __name__)


@blueprint_route_extract_v2.route('/extract_configs', methods=['POST'])
@cross_origin(origin='*')
def extract_configs():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    def call_process():
        done = handler_api.pull(
            tenant_key, settings_2_0.extract_function, use_cache)
        return done

    return response_utils.call_and_get_response(call_process)


@blueprint_route_extract_v2.route('/extract_configs_scope', methods=['POST'])
@cross_origin(origin='*')
def extract_configs_scope():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')
    scope = flask_utils.get_arg('scope', 'HOST-4CF7798838A2AFA7')

    def call_process():
        done = handler_api.pull(
            tenant_key, settings_2_0.extract_specific_scope, use_cache, input_params=scope)
        return done

    return response_utils.call_and_get_response(call_process)


@blueprint_route_extract_v2.route('/extract_entity_v2', methods=['POST'])
@cross_origin(origin='*')
def extract_entity_v2():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')
    run_info = process_utils.get_run_info(tenant_key, tenant_key)

    def call_process():
        done = handler_api.pull(
            tenant_key, entity_v2.extract_function, use_cache, run_info=run_info)
        return done

    return response_utils.call_and_get_response(call_process, run_info)

@blueprint_route_extract_v2.route('/test_connection', methods=['POST'])
@cross_origin(origin='*')
def test_connection():
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    def call_process():
        config = credentials.get_api_call_credentials(tenant_key)
        schema_dict = settings_2_0_schemas.extract_schemas(config, False, False)
        
        return schema_dict

    return response_utils.call_and_get_response(call_process)
