# Copyright 2023 Dynatrace LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#      https://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

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
