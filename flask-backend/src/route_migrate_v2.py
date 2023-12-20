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
import flask_utils
import process_migrate_config
import ui_api_entity_config
import process_utils
import response_utils

blueprint_route_migrate_v2 = Blueprint('blueprint_route_migrate_v2', __name__)


@blueprint_route_migrate_v2.route('/migrate_settings_2_0', methods=['POST'])
@cross_origin(origin='*')
def migrate_settings_2_0():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             process_utils.ALL_BASIC_ENTITY_LIST)
    active_rules = flask_utils.get_arg_json('active_rules')
    forced_entity_id_main = flask_utils.get_arg('forced_entity_id_main')
    forced_entity_id_target = flask_utils.get_arg('forced_entity_id_target')
    forced_schema_id = flask_utils.get_arg('forced_schema_id')
    forced_key_id = flask_utils.get_arg('forced_key_id')
    forced_keep_action_only = flask_utils.get_arg_json(
        'forced_keep_action_only')
    context_params = flask_utils.get_arg_json('context_params')
    use_environment_cache = flask_utils.get_arg_bool(
        'use_environment_cache', False)
    preemptive_config_copy = flask_utils.get_arg_bool(
        'preemptive_config_copy', False)
    pre_migration = flask_utils.get_arg_bool('pre_migration', True)
    enable_dashboards = flask_utils.get_arg_bool('enable_dashboards', False)
    enable_omit_destroy = flask_utils.get_arg_bool('enable_omit_destroy', False)
    enable_ultra_parallel = flask_utils.get_arg_bool('enable_ultra_parallel', False)
    terraform_parallelism = flask_utils.get_arg_int('terraform_parallelism', process_utils.DEFAULT_TERRAFORM_PARALLELISM)
    
    action_id = flask_utils.get_arg("action_id")

    run_info = process_utils.get_run_info(
        tenant_key_main, tenant_key_target, context_params, entity_filter, use_environment_cache=use_environment_cache,
        forced_entity_id_main=forced_entity_id_main, forced_entity_id_target=forced_entity_id_target, forced_schema_id=forced_schema_id, forced_key_id=forced_key_id,
        forced_keep_action_only=forced_keep_action_only, preemptive_config_copy=preemptive_config_copy, enable_dashboards=enable_dashboards,
        enable_omit_destroy=enable_omit_destroy, terraform_parallelism=terraform_parallelism, enable_ultra_parallel=enable_ultra_parallel, action_id=action_id)

    def call_process():
        result = process_migrate_config.migrate_config(
            run_info,
            tenant_key_main, tenant_key_target, active_rules, context_params, pre_migration)
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_migrate_v2.route('/migrate_ui_api_entity', methods=['POST'])
@cross_origin(origin='*')
def migrate_ui_api_entity():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             process_utils.ALL_BASIC_ENTITY_LIST)
    active_rules = flask_utils.get_arg_json('active_rules')
    context_params = flask_utils.get_arg_json('context_params')
    use_environment_cache = flask_utils.get_arg_bool(
        'use_environment_cache', False)
    pre_migration = flask_utils.get_arg_bool('pre_migration', True)

    run_info = process_utils.get_run_info(
        tenant_key_main, tenant_key_target, context_params, entity_filter, use_environment_cache=use_environment_cache)

    def call_process():
        done = ui_api_entity_config.copy_entity(run_info)
        return done

    return response_utils.call_and_get_response(call_process, run_info)
