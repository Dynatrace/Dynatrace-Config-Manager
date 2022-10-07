from main_server import app
from flask import Flask, request, jsonify
from flask_cors import cross_origin
import json
import options


@app.route('/execution_options', methods=['GET'])
@cross_origin(origin='*')
def execution_options_get():

    execution_options = options.load_execution_options()

    response = app.response_class(
        response=json.dumps(execution_options),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/execution_options', methods=['POST'])
@cross_origin(origin='*')
def execution_options_post():
    payload = json.loads(request.data.decode("utf-8"))

    options.save_execution_options(payload)

    response = app.response_class(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/global_settings', methods=['GET'])
@cross_origin(origin='*')
def global_settings_get():

    global_settings = options.load_global_settings()

    response = app.response_class(
        response=json.dumps(global_settings),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/global_settings', methods=['POST'])
@cross_origin(origin='*')
def global_settings_post():
    payload = json.loads(request.data.decode("utf-8"))

    options.save_global_settings(payload)

    response = app.response_class(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/entity_filter', methods=['GET'])
@cross_origin(origin='*')
def entity_filter_get():

    global_settings = options.load_entity_filter()

    response = app.response_class(
        response=json.dumps(global_settings),
        status=200,
        mimetype='application/json'
    )

    return response


@app.route('/entity_filter', methods=['POST'])
@cross_origin(origin='*')
def entity_filter_post():
    payload = json.loads(request.data.decode("utf-8"))

    options.save_entity_filter(payload)

    response = app.response_class(
        response=json.dumps(payload),
        status=200,
        mimetype='application/json'
    )

    return response
