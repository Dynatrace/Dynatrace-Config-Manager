from flask import Flask, Response
import json
from exception import UIForwartException


def call_and_get_response(call_process):

    result = None
    return_status = 200

    try:
        result = call_process()
    except (UIForwartException, OverflowError) as err:
        result = {"error": str(err)}
        return_status = 400

    response = Response(
        response=json.dumps(result),
        status=return_status,
        mimetype='application/json'
    )

    return response
