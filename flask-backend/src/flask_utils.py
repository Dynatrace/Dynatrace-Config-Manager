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

from flask import request
import json
from urllib.parse import parse_qs

def get_arg(key, default=None):
    value = request.args.get(key)

    if(value is None):
        return default

    return value

def get_arg_json(key, default=None):
    value = request.args.get(key)

    if(value is None): 
       return default

    return json.loads(value)


def get_arg_bool(key, default=None):
    value = get_arg(key, default=None)
    valid = False

    if(isinstance(value, str)):
        if((value.lower()) == "false"):
            value = False
            valid = True
        elif((value.lower()) == "true"):
            value = True
            valid = True

    if(valid == False):
        print("Bad parameter value for", key, value, "using default:", default)
        return default

    return value


def get_arg_int(key, default=None):
    value = get_arg(key, default=None)
    valid = False

    if(value is None):
        pass
    elif(value.isnumeric()
         and float(value).is_integer()):
        value = int(value)
        valid = True

    if(valid == False):
        print("Bad parameter value for", key, value, "using default:", default)
        value = default

    return value
