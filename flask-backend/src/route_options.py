from flask import Flask, request, Blueprint
from flask_cors import cross_origin
import json
import options
import response_utils

blueprint_route_options = Blueprint('blueprint_route_options', __name__)


@blueprint_route_options.route('/execution_options', methods=['GET'])
@cross_origin(origin='*')
def execution_options_get():

    def call_process():
        execution_options = options.load_execution_options()
        return execution_options

    return response_utils.call_and_get_response(call_process)


@blueprint_route_options.route('/execution_options', methods=['POST'])
@cross_origin(origin='*')
def execution_options_post():
    payload = json.loads(request.data.decode("utf-8"))

    def call_process():

        options.save_execution_options(payload)
        return payload

    return response_utils.call_and_get_response(call_process)


@blueprint_route_options.route('/global_settings', methods=['GET'])
@cross_origin(origin='*')
def global_settings_get():

    def call_process():
        global_settings = options.load_global_settings()
        return global_settings

    return response_utils.call_and_get_response(call_process)


@blueprint_route_options.route('/global_settings', methods=['POST'])
@cross_origin(origin='*')
def global_settings_post():
    payload = json.loads(request.data.decode("utf-8"))

    def call_process():
        options.save_global_settings(payload)
        return payload

    return response_utils.call_and_get_response(call_process)


@blueprint_route_options.route('/entity_filter', methods=['GET'])
@cross_origin(origin='*')
def entity_filter_get():

    def call_process():
        entity_filter = options.load_entity_filter()
        return entity_filter

    return response_utils.call_and_get_response(call_process)


@blueprint_route_options.route('/entity_filter', methods=['POST'])
@cross_origin(origin='*')
def entity_filter_post():
    payload = json.loads(request.data.decode("utf-8"))

    def call_process():
        options.save_entity_filter(payload)
        return payload

    return response_utils.call_and_get_response(call_process)
