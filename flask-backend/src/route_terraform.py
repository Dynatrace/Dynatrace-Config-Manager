from flask import Flask, request, Blueprint
from flask_cors import cross_origin
import flask_utils
import response_utils
import terraform_cli

blueprint_route_terraform = Blueprint("blueprint_route_terraform", __name__)


@blueprint_route_terraform.route("/terraform_plan_target", methods=["POST"])
@cross_origin(origin="*")
def terraform_plan_target():
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    terraform_params = flask_utils.get_arg_json("terraform_params")
    action_id = flask_utils.get_arg("action_id")
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        log_content = terraform_cli.plan_target(
            run_info, tenant_key_target, terraform_params, action_id
        )

        result = {}
        result["log_content"] = log_content
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_apply_target", methods=["POST"])
@cross_origin(origin="*")
def terraform_apply_target():
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    terraform_params = flask_utils.get_arg_json("terraform_params")
    action_id = flask_utils.get_arg("action_id")
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        log_content = terraform_cli.apply_target(
            run_info, tenant_key_target, terraform_params, action_id
        )

        result = {}
        result["log_content"] = log_content
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)

@blueprint_route_terraform.route("/terraform_plan_all", methods=["POST"])
@cross_origin(origin="*")
def terraform_plan_all():
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    terraform_params = flask_utils.get_arg_json("terraform_params")
    action_id = flask_utils.get_arg("action_id")
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        log_content = terraform_cli.plan_all(
            run_info, tenant_key_target, terraform_params, action_id
        )

        result = {}
        result["log_content"] = log_content
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_apply_all", methods=["POST"])
@cross_origin(origin="*")
def terraform_apply_all():
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    terraform_params = flask_utils.get_arg_json("terraform_params")
    action_id = flask_utils.get_arg("action_id")
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        log_content = terraform_cli.apply_all(
            run_info, tenant_key_target, terraform_params, action_id
        )

        result = {}
        result["log_content"] = log_content
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)
