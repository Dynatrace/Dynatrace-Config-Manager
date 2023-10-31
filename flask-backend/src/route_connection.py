from flask import Flask, Blueprint
from flask_cors import cross_origin
import credentials
import flask_utils
import response_utils
import settings_2_0_schemas

blueprint_route_connection = Blueprint("blueprint_route_connection", __name__)


@blueprint_route_connection.route("/test_connection", methods=["POST"])
@cross_origin(origin="*")
def test_connection():
    tenant_key = flask_utils.get_arg("tenant_key", "0")

    def call_process():
        config = credentials.get_api_call_credentials(tenant_key)
        schema_dict = settings_2_0_schemas.extract_schemas(config, False, False, skip_404=False)

        return schema_dict

    return response_utils.call_and_get_response(call_process)
