from flask import Flask, request, Blueprint
from flask_cors import cross_origin
import flask_utils
import monaco_cli
import response_utils

blueprint_route_monaco = Blueprint('blueprint_route_monaco', __name__)


@blueprint_route_monaco.route('/monaco_test', methods=['GET'])
@cross_origin(origin='*')
def monaco_test():

    tenant_key = flask_utils.get_arg('tenant_key', '0')
    run_info = {'aggregate_error': [], 'return_status': 200}
    print(run_info)

    def call_process():
        monaco_list = monaco_cli.extract_entities(run_info, tenant_key)
        return monaco_list

    return response_utils.call_and_get_response(call_process, run_info)
