from flask import Flask, request, Blueprint
from flask_cors import cross_origin
import json
import tenant
import response_utils

blueprint_route_tenant = Blueprint('blueprint_route_tenant', __name__)


@blueprint_route_tenant.route('/tenant_list', methods=['GET'])
@cross_origin(origin='*')
def tenant_list_get():

    def call_process():
        tenant_list = tenant.load_tenant_list()
        return tenant_list

    return response_utils.call_and_get_response(call_process)


@blueprint_route_tenant.route('/tenant_list', methods=['POST'])
@cross_origin(origin='*')
def tenant_list_post():
    payload = json.loads(request.data.decode("utf-8"))

    def call_process():
        tenant.save_tenant_list(payload)
        return payload

    return response_utils.call_and_get_response(call_process)
