from flask import Blueprint
from flask_cors import cross_origin
import flask_utils
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
