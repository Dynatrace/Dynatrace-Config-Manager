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
