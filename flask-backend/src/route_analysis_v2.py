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
import settings_2_0
import handler_api
import flask_utils
import process_match_entities
from process_analysis import KeyAnalysis
from process_match_entities import EntitiesDumpJSON, EntityTypeDumpJSON
import process_utils
import response_utils
import entity_v2

blueprint_route_analysis_v2 = Blueprint(
    'blueprint_route_analysis_v2', __name__)


@blueprint_route_analysis_v2.route('/analyze_settings_2_0', methods=['POST'])
@cross_origin(origin='*')
def analyze_settings_2_0():
    tenant_key = flask_utils.get_arg('tenant_key', '0')

    def call_process():
        #analysis_object = ScopeTypeAnalysis()
        analysis_object = KeyAnalysis()

        done = handler_api.analyze(
            tenant_key, settings_2_0.extract_function, analysis_object)
        return done

    return response_utils.call_and_get_response(call_process)


@blueprint_route_analysis_v2.route('/match_entities_v2', methods=['POST'])
@cross_origin(origin='*')
def match_entities_v2():
    tenant_key_main = flask_utils.get_arg('tenant_key_main', '0')
    tenant_key_target = flask_utils.get_arg('tenant_key_target', '0')
    time_from = flask_utils.get_arg_int('time_from')
    time_to = flask_utils.get_arg_int('time_to')
    entity_filter = flask_utils.get_arg_json('entity_filter',
                                             process_utils.ALL_BASIC_ENTITY_LIST)
    active_rules = flask_utils.get_arg_json('active_rules')
    context_params = flask_utils.get_arg_json('context_params')
    use_environment_cache = flask_utils.get_arg_bool(
        'use_environment_cache', False)

    run_info = process_utils.get_run_info(
        tenant_key_main, tenant_key_target, context_params, entity_filter, time_from, time_to, use_environment_cache)

    def call_process():

        result = process_match_entities.match_entities_tree(
            run_info, active_rules, context_params)
        return result

    return response_utils.call_and_get_response(call_process, run_info)


@blueprint_route_analysis_v2.route('/analyze_entities_v2', methods=['POST'])
@cross_origin(origin='*')
def analyze_entities_v2():
    tenant_key = flask_utils.get_arg('tenant_key', '4')

    def call_process():
        analysis_object = EntitiesDumpJSON()

        done = handler_api.analyze(
            tenant_key, entity_v2.extract_function, analysis_object)
        return done

    return response_utils.call_and_get_response(call_process)


@blueprint_route_analysis_v2.route('/analyze_entity_types_v2', methods=['POST'])
@cross_origin(origin='*')
def analyze_entity_types_v2():
    tenant_key = flask_utils.get_arg('tenant_key', '4')

    def call_process():
        analysis_object = EntityTypeDumpJSON()

        done = handler_api.analyze(
            tenant_key, entity_v2.extract_entity_types, analysis_object)
        return done

    return response_utils.call_and_get_response(call_process)
