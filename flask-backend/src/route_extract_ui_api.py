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

from flask import Flask, Blueprint
from flask_cors import cross_origin
import ui_api_entity_config
import flask_utils
import response_utils

blueprint_route_extract_ui_api = Blueprint(
    'blueprint_route_extract_ui_api', __name__)


@blueprint_route_extract_ui_api.route('/extract_ui_api_entity', methods=['POST'])
@cross_origin(origin='*')
def extract_ui_api_entity():
    use_cache = flask_utils.get_arg_bool('use_cache', False)
    tenant_key = flask_utils.get_arg('tenant_key', '0')
    entity_id = flask_utils.get_arg('entity_id')

    def call_process():
        done = ui_api_entity_config.get_entity(
            tenant_key, entity_id, use_cache, cache_only=False)
        return done

    return response_utils.call_and_get_response(call_process)
