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

from flask import Flask, render_template
from flask_cors import CORS

import environment

from route_extract_ui_api import blueprint_route_extract_ui_api
from route_analysis_v2 import blueprint_route_analysis_v2
from route_connection import blueprint_route_connection
from route_extract_v2 import blueprint_route_extract_v2
from route_migrate_v2 import blueprint_route_migrate_v2
from route_options import blueprint_route_options
from route_proxy import blueprint_route_proxy
from route_tenant import blueprint_route_tenant
from route_terraform import blueprint_route_terraform
from route_test_monaco import blueprint_route_monaco


FLASK_HOST = environment.get_flask_host()
FLASK_PORT = environment.get_flask_port()

app = Flask(__name__, template_folder="./")
app.register_blueprint(blueprint_route_extract_ui_api)
app.register_blueprint(blueprint_route_analysis_v2)
app.register_blueprint(blueprint_route_connection)
app.register_blueprint(blueprint_route_extract_v2)
app.register_blueprint(blueprint_route_migrate_v2)
app.register_blueprint(blueprint_route_options)
app.register_blueprint(blueprint_route_proxy)
app.register_blueprint(blueprint_route_tenant)
app.register_blueprint(blueprint_route_monaco)
app.register_blueprint(blueprint_route_terraform)
CORS(app)


@app.route("/")
def my_index():
    template = render_template("index.html")
    print(template)
    print("localhost" in template)
    return template


if __name__ == "__main__":
    print("Running on port:", FLASK_PORT)
    app.run(port=FLASK_PORT, host=FLASK_HOST)
