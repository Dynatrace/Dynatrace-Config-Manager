from flask import Flask, Response
import json
from exception import UIForwartException


def call_and_get_response(call_process, run_info=None):

    result = None
    return_status = 200

    try:
        result = call_process()

        if (run_info is None):
            pass

        else:
            if ('aggregate_error' in run_info
                    and len(run_info['aggregate_error']) >= 1):
                result['aggregate_error'] = run_info['aggregate_error']
                
            if('return_status' in run_info):
                return_status = run_info['return_status']

    except (UIForwartException, OverflowError) as err:
        result = {"error": str(err)}
        return_status = 400

    response = Response(
        response=json.dumps(result),
        status=return_status,
        mimetype='application/json'
    )

    return response
