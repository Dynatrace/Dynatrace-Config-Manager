from flask import Flask
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


# import declared routes
import route_analysis_v2
import route_extract_ui_api
import route_extract_v2
import route_migrate_v2
import route_options
import route_tenant