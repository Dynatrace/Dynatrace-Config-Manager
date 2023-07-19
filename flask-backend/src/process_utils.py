from flask import request
import json
import handler_api
from filter import AnalysisFilter
import process_analyze_schemas

UNIQUE_ENTITY_LIST = ["environment"]
ALL_BASIC_ENTITY_LIST = [
    "HOST",
    "HOST_GROUP",
    "PROCESS_GROUP",
    "SERVICE",
    "APPLICATION",
    "environment",
]


def execute_match(run_info, analysis_class, extract_function, live_extract=False):
    all_tenant_match_dict = {}

    for tenant_dict in run_info["tenant_param_dict"].values():
        tenant_key = tenant_dict["tenant_key"]

        if tenant_key in all_tenant_match_dict:
            pass
        else:
            if live_extract:
                handler_api.pull(
                    tenant_key,
                    extract_function,
                    use_cache=False,
                    input_params=tenant_dict["scope"],
                    run_info=run_info,
                )

            run_info["analysis_filter"].set_target_tenant(
                tenant_dict["is_target_tenant"]
            )
            analysis_object = analysis_class(run_info)

            all_tenant_match_dict[tenant_key] = handler_api.analyze(
                tenant_key,
                extract_function,
                analysis_object,
                input_params=tenant_dict["scope"],
            )

    return run_info, all_tenant_match_dict


def get_tenant_id(run_info, is_target_tenant):
    if is_target_tenant:
        return run_info["tenant_key_target"]
    else:
        return run_info["tenant_key_main"]


def get_tenant_schemas_definitions_dict(run_info, is_target_tenant):
    if "schemas_definitions_dict" in run_info:
        pass
    else:
        run_info["schemas_definitions_dict"] = process_analyze_schemas.analyze_schemas(
            run_info
        )

    return run_info["schemas_definitions_dict"][
        get_tenant_id(run_info, is_target_tenant)
    ]


def get_run_info(
    tenant_key_main,
    tenant_key_target,
    context_params=None,
    entity_filter=None,
    time_from=None,
    time_to=None,
    use_environment_cache=None,
    forced_entity_id_main=None,
    forced_entity_id_target=None,
    forced_schema_id=None,
    forced_key_id=None,
    forced_keep_action_only=None,
    preemptive_config_copy=False,
    enable_dashboards=False,
    enable_omit_destroy=False,
    time_from_minutes=None,
    time_to_minutes=None,
    action_id=None,
):
    run_info = {}

    run_info = set_run_tags(
        run_info, tenant_key_main, tenant_key_target, context_params
    )
    run_info["tenant_param_dict"] = get_tenant_param_dict(
        tenant_key_main, tenant_key_target, run_info, context_params
    )
    run_info["tenant_key_main"] = tenant_key_main
    run_info["tenant_key_target"] = tenant_key_target
    run_info = set_analysis_filter(
        run_info,
        entity_filter,
        time_from,
        time_to,
        use_environment_cache,
        forced_entity_id_main,
        forced_entity_id_target,
        forced_schema_id,
        forced_key_id,
    )
    run_info["forced_keep_action_only"] = forced_keep_action_only
    run_info["preemptive_config_copy"] = preemptive_config_copy
    run_info["enable_dashboards"] = enable_dashboards
    run_info["enable_omit_destroy"] = enable_omit_destroy
    run_info["time_from_minutes"] = time_from_minutes
    run_info["time_to_minutes"] = time_to_minutes
    run_info["action_id"] = action_id

    return run_info


def set_analysis_filter(
    run_info,
    entity_filter,
    time_from,
    time_to,
    use_environment_cache,
    forced_entity_id_main,
    forced_entity_id_target,
    forced_schema_id,
    forced_key_id,
):
    if run_info["unique_entity"]:
        entity_filter = UNIQUE_ENTITY_LIST

    run_info["analysis_filter"] = AnalysisFilter(entity_filter, time_from, time_to)

    if use_environment_cache is None:
        run_info["use_environment_cache"] = True
    else:
        run_info["use_environment_cache"] = use_environment_cache

    run_info["forced_entity_id_main"] = forced_entity_id_main
    run_info["forced_entity_id_target"] = forced_entity_id_target
    run_info["forced_schema_id"] = forced_schema_id
    run_info["forced_key_id"] = forced_key_id

    return run_info


def set_run_tags(run_info, tenant_key_main, tenant_key_target, context_params):
    run_info["self_match"] = tenant_key_main == tenant_key_target
    run_info["forced_match"] = (
        context_params is not None and "provided_id" in context_params
    )
    run_info["unique_entity"] = False

    if run_info["forced_match"]:
        for target, main in context_params["provided_id"].items():
            if target in UNIQUE_ENTITY_LIST or main in UNIQUE_ENTITY_LIST:
                run_info["unique_entity"] = True

    return run_info


def build_config_aggregate_error_msg(config_dict, error):
    err_msg = str(error)
    err_msg += ": "

    for key in ["schema_id", "type", "entity_id_dict", "key_id"]:
        if key in config_dict:
            if config_dict[key] == "":
                pass
            else:
                err_msg = err_msg + " " + key + ": " + str(config_dict[key]) + ","

    return err_msg


def add_config_aggregate_error(run_info, config_dict, error):
    err_object = {
        "err_msg": build_config_aggregate_error_msg(config_dict, error),
        "err_resp": error.response_text,
    }

    add_aggregate_error_response(run_info, err_object)


def add_aggregate_error(run_info, error):
    if "aggregate_error" in run_info:
        pass
    else:
        run_info["aggregate_error"] = []

    run_info["aggregate_error"].append(str(error))


def add_aggregate_error_response(run_info, error):
    if "aggregate_error_response" in run_info:
        pass
    else:
        run_info["aggregate_error_response"] = []

    print("ADD: ", error)
    run_info["aggregate_error_response"].append(json.dumps(error))


def set_warning_message(run_info, message):
    if "warnings" in run_info:
        pass
    else:
        run_info["warnings"] = []

    if message in run_info["warnings"]:
        pass
    else:
        run_info["warnings"].append(message)


def is_filtered_out_action(run_info, action):
    if run_info["forced_keep_action_only"] is None:
        return False

    if action in run_info["forced_keep_action_only"]:
        if run_info["forced_keep_action_only"][action] == True:
            return False

    return True

def add_action_id_to_filename(run_info, filename):
    return run_info["action_id"] + "_" + filename


def get_tenant_param_dict(
    tenant_key_main, tenant_key_target, run_info, context_params=None
):
    tenant_param_dict = {}

    scope_main = None
    scope_target = None

    if context_params is None:
        pass
    else:
        if run_info["forced_match"]:
            for target, main in context_params["provided_id"].items():
                scope_main = main
                scope_target = target

    tenant_param_dict[tenant_key_main] = create_tenant_dict(
        tenant_key_main, False, scope_main
    )
    tenant_param_dict[tenant_key_target] = create_tenant_dict(
        tenant_key_target, True, scope_target
    )

    return tenant_param_dict


def create_tenant_dict(tenant_key, is_target_tenant, scope):
    return {
        "tenant_key": tenant_key,
        "is_target_tenant": is_target_tenant,
        "scope": scope,
    }


def get_arg_json(key, default=None):
    value = request.args.get(key)

    if value is None:
        return default

    return json.loads(value)


def get_arg_bool(key, default=None):
    value = get_arg(key, default=None)
    valid = False

    if isinstance(value, str):
        if (value.lower()) == "false":
            value = False
            valid = True
        elif (value.lower()) == "true":
            value = True
            valid = True

    if valid == False:
        print("Bad parameter value for", key, value, "using default:", default)
        return default

    return value


def get_arg_int(key, default=None):
    value = get_arg(key, default=None)
    valid = False

    if value is None:
        pass
    elif value.isnumeric() and float(value).is_integer():
        value = int(value)
        valid = True

    if value == True:
        print("Bad parameter value for", key, value, "using default:", default)
        value = default

    return value