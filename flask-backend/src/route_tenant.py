from flask import Flask, request, jsonify, Blueprint, Response
from flask_cors import cross_origin
import json
import tenant

blueprint_route_tenant = Blueprint('blueprint_route_tenant', __name__)

@blueprint_route_tenant.route('/tenant_list', methods=['GET'])
@cross_origin(origin='*')
def tenant_list_get():
    
    tenant_list = tenant.load_tenant_list()

    response = Response(
        response=json.dumps(tenant_list),
        status=200,
        mimetype='application/json'
    )

    return response


@blueprint_route_tenant.route('/tenant_list', methods=['POST'])
@cross_origin(origin='*')
def tenant_list_post():
    payload = json.loads(request.data.decode("utf-8"))

    tenant.save_tenant_list(payload)

    response = Response(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response
