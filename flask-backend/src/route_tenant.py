from main_server import app
from flask import Flask, request, jsonify
from flask_cors import cross_origin
import threading
import json
import tenant


@app.route('/tenant_list', methods=['GET'])
@cross_origin(origin='*')
def tenant_list_get():
    
    tenant_list = tenant.load_tenant_list()

    response = app.response_class(
        response=json.dumps(tenant_list),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/tenant_list', methods=['POST'])
@cross_origin(origin='*')
def tenant_list_post():
    payload = json.loads(request.data.decode("utf-8"))

    tenant.save_tenant_list(payload)

    response = app.response_class(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response
