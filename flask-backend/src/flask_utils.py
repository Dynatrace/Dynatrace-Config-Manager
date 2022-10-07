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

    if(value == True):
        print("Bad parameter value for", key, value, "using default:", default)
        value = default

    return value
