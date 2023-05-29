from flask import Flask, render_template
from flask_cors import CORS
from route_extract_ui_api import blueprint_route_extract_ui_api
from route_analysis_v2 import blueprint_route_analysis_v2
from route_extract_v2 import blueprint_route_extract_v2
from route_migrate_v2 import blueprint_route_migrate_v2
from route_options import blueprint_route_options
from route_tenant import blueprint_route_tenant
from route_terraform import blueprint_route_terraform
from route_test_monaco import blueprint_route_monaco

FLASK_PORT = 5004

app = Flask(__name__, template_folder='./')
app.register_blueprint(blueprint_route_extract_ui_api)
app.register_blueprint(blueprint_route_analysis_v2)
app.register_blueprint(blueprint_route_extract_v2)
app.register_blueprint(blueprint_route_migrate_v2)
app.register_blueprint(blueprint_route_options)
app.register_blueprint(blueprint_route_tenant)
app.register_blueprint(blueprint_route_monaco)
app.register_blueprint(blueprint_route_terraform)
CORS(app)


@app.route("/")
def my_index():
    return render_template("index.html")


if (__name__ == "__main__"):
    print("Running on port:", FLASK_PORT)
    app.run(port=FLASK_PORT)
