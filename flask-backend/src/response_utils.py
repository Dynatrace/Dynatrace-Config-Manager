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

from flask import Flask, Response
import json
from exception import UIForwartException


def call_and_get_response(call_process, run_info=None):

    result = None
    return_status = 200

    try:
        result = call_process()
        
        if(result is None):
            result = {}

        if (run_info is None):
            pass

        else:
            if ('aggregate_error' in run_info
                    and len(run_info['aggregate_error']) >= 1):
                result['aggregate_error'] = run_info['aggregate_error']

            if ('aggregate_error_response' in run_info
                    and len(run_info['aggregate_error_response']) >= 1):
                result['aggregate_error_response'] = run_info['aggregate_error_response']

            if ('return_status' in run_info):
                return_status = run_info['return_status']

            if ('warnings' in run_info):
                result['warnings'] = run_info['warnings']

    except (UIForwartException, OverflowError) as err:
        result = {"error": str(err)}
        return_status = 400

    response = Response(
        response=json.dumps(result),
        status=return_status,
        mimetype='application/json'
    )

    return response
