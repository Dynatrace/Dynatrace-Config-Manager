from flask import Flask, request, jsonify, Blueprint, Response
from flask_cors import cross_origin
import json
import options

blueprint_route_options = Blueprint('blueprint_route_options', __name__)

@blueprint_route_options.route('/execution_options', methods=['GET'])
@cross_origin(origin='*')
def execution_options_get():

    execution_options = options.load_execution_options()

    response = Response(
        response=json.dumps(execution_options),
        status=200,
        mimetype='application/json'
    )

    return response


@blueprint_route_options.route('/execution_options', methods=['POST'])
@cross_origin(origin='*')
def execution_options_post():
    payload = json.loads(request.data.decode("utf-8"))

    options.save_execution_options(payload)

    response = Response(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response


@blueprint_route_options.route('/global_settings', methods=['GET'])
@cross_origin(origin='*')
def global_settings_get():

    global_settings = options.load_global_settings()

    response = Response(
        response=json.dumps(global_settings),
        status=200,
        mimetype='application/json'
    )

    return response


@blueprint_route_options.route('/global_settings', methods=['POST'])
@cross_origin(origin='*')
def global_settings_post():
    payload = json.loads(request.data.decode("utf-8"))

    options.save_global_settings(payload)

    response = Response(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response


@blueprint_route_options.route('/entity_filter', methods=['GET'])
@cross_origin(origin='*')
def entity_filter_get():

    global_settings = options.load_entity_filter()

    response = Response(
        response=json.dumps(global_settings),
        status=200,
        mimetype='application/json'
    )

    return response


@blueprint_route_options.route('/entity_filter', methods=['POST'])
@cross_origin(origin='*')
def entity_filter_post():
    payload = json.loads(request.data.decode("utf-8"))

    options.save_entity_filter(payload)

    response = Response(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response
