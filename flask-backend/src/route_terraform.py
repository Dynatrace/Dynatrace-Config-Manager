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
import flask_utils
import json

import process_utils
import response_utils
import terraform_cli
import terraform_cli_cmd
import terraform_local
import terraform_history

blueprint_route_terraform = Blueprint("blueprint_route_terraform", __name__)


@blueprint_route_terraform.route("/terraform_plan_target", methods=["POST"])
@cross_origin(origin="*")
def terraform_plan_target():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    action_id = flask_utils.get_arg("action_id")

    terraform_params = request.get_json()

    run_info = {"aggregate_error": [], "return_status": 200, "action_id": action_id}

    def call_process():
        log_dict = terraform_local.plan_multi_target(
            run_info,
            tenant_key_main,
            tenant_key_target,
            terraform_params,
        )

        result = {}
        result["log_dict"] = log_dict
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_apply_target", methods=["POST"])
@cross_origin(origin="*")
def terraform_apply_target():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    action_id = flask_utils.get_arg("action_id")

    terraform_params = request.get_json()

    run_info = {"aggregate_error": [], "return_status": 200, "action_id": action_id}

    def call_process():
        ui_payload, log_dict = terraform_cli.apply_multi_target(
            run_info,
            tenant_key_main,
            tenant_key_target,
            terraform_params,
        )

        result = {}
        result["ui_payload"] = ui_payload
        result["log_dict"] = log_dict
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_plan_all", methods=["POST"])
@cross_origin(origin="*")
def terraform_plan_all():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    action_id = flask_utils.get_arg("action_id")

    run_info = {
        "aggregate_error": [],
        "return_status": 200,
        "enable_omit_destroy": False,
        "terraform_parallelism": process_utils.DEFAULT_TERRAFORM_PARALLELISM,
        "action_id": action_id,
    }

    def call_process():
        ui_payload, log_dict = terraform_cli.plan_all(
            run_info, tenant_key_main, tenant_key_target
        )

        result = {}
        result["ui_payload"] = ui_payload
        result["log_dict"] = log_dict
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_apply_all", methods=["POST"])
@cross_origin(origin="*")
def terraform_apply_all():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    action_id = flask_utils.get_arg("action_id", "0")
    run_info = {"aggregate_error": [], "return_status": 200, "action_id": action_id}

    def call_process():
        ui_payload, log_dict = terraform_cli.apply_all(
            run_info, tenant_key_main, tenant_key_target
        )

        result = {}
        result["ui_payload"] = ui_payload
        result["log_dict"] = log_dict
        result["action_id"] = action_id
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_plan_all_resource_diff", methods=["GET"])
@cross_origin(origin="*")
def terraform_plan_all_resource_diff():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    module = flask_utils.get_arg("module", "")
    unique_name = flask_utils.get_arg("unique_name", "")
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        lines = terraform_local.load_plan_all_resource_diff(
            run_info, tenant_key_main, tenant_key_target, module, unique_name
        )

        result = {}
        result["lines"] = lines
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_load_ui_payload", methods=["POST"])
@cross_origin(origin="*")
def terraform_load_ui_payload():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    run_info = {"aggregate_error": [], "return_status": 200}

    def call_process():
        ui_payload = terraform_local.load_ui_payload(tenant_key_main, tenant_key_target)

        result = {}
        result["ui_payload"] = ui_payload
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_terraform.route("/terraform_history_configs", methods=["GET"])
@cross_origin(origin="*")
def get_terraform_history_configs():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")

    def call_process():
        history = terraform_history.load_history_configs(
            tenant_key_main, tenant_key_target
        )
        return history

    return response_utils.call_and_get_response(call_process)


@blueprint_route_terraform.route("/terraform_history_configs", methods=["POST"])
@cross_origin(origin="*")
def save_terraform_history_configs():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")

    payload = json.loads(request.data.decode("utf-8"))

    def call_process():
        terraform_history.save_history_configs(
            tenant_key_main, tenant_key_target, payload
        )
        return payload

    return response_utils.call_and_get_response(call_process)


@blueprint_route_terraform.route("/terraform_load_history_list", methods=["GET"])
@cross_origin(origin="*")
def terraform_load_history_list():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")

    def call_process():
        history = terraform_history.load_history_list(
            tenant_key_main, tenant_key_target
        )
        return history

    return response_utils.call_and_get_response(call_process)


@blueprint_route_terraform.route("/terraform_load_history_item", methods=["GET"])
@cross_origin(origin="*")
def terraform_load_history_item():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    history_type = flask_utils.get_arg("history_type")
    history_name = flask_utils.get_arg("history_name")

    def call_process():
        history = terraform_history.load_history_item(
            tenant_key_main, tenant_key_target, history_type, history_name
        )

        return history

    return response_utils.call_and_get_response(call_process)


@blueprint_route_terraform.route("/terraform_load_history_item_log", methods=["GET"])
@cross_origin(origin="*")
def terraform_load_history_item_log():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    history_type = flask_utils.get_arg("history_type")
    history_name = flask_utils.get_arg("history_name")
    history_log = flask_utils.get_arg("history_log")

    def call_process():
        log_dict = terraform_history.load_history_item_log(
            tenant_key_main, tenant_key_target, history_type, history_name, history_log
        )

        return log_dict

    return response_utils.call_and_get_response(call_process)


@blueprint_route_terraform.route(
    "/terraform_open_history_log_in_vscode", methods=["POST"]
)
@cross_origin(origin="*")
def terraform_open_history_log_in_vscode():
    tenant_key_main = flask_utils.get_arg("tenant_key_main", "0")
    tenant_key_target = flask_utils.get_arg("tenant_key_target", "0")
    history_type = flask_utils.get_arg("history_type")
    history_name = flask_utils.get_arg("history_name")
    history_log = flask_utils.get_arg("history_log")

    def call_process():
        terraform_history.open_history_item_log_vscode(
            tenant_key_main, tenant_key_target, history_type, history_name, history_log
        )

        result = {}

        return result

    return response_utils.call_and_get_response(call_process)


@blueprint_route_terraform.route("/terraform_check_exec", methods=["GET"])
@cross_origin(origin="*")
def terraform_check_exec():
    def call_process():
        return terraform_cli_cmd.run_terraform_validation_checks()

    return response_utils.call_and_get_response(call_process)
