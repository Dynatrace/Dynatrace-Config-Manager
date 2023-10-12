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

from flask import Blueprint
from flask_cors import cross_origin
import proxy
import response_utils

blueprint_route_proxy = Blueprint("blueprint_route_proxy", __name__)


@blueprint_route_proxy.route("/proxy_get_env", methods=["GET"])
@cross_origin(origin="*")
def proxy_get_env():
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        return {"proxy": proxy.get_proxy_from_env()}

    return response_utils.call_and_get_response(call_process, run_info)
