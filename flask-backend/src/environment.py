import os

HOST_VAR_NAME = "DCM_HOST"
PORT_VAR_NAME = "DCM_PORT"

FLASK_PORT_DEFAULT = 3004


def env_var_message():
    print("\nEnvironment variables:")
    print("\n  {HOST_VAR_NAME}:")
    print(
        "    - By default, the server will be only available on localhost, as it is safer"
    )
    print(
        "    - To make it available from other computers, you could set the {HOST_VAR_NAME} environment variable to the ip address zero: 0.0.0.0"
    )
    print(f"\n  {PORT_VAR_NAME}:")
    print(
        f"    - The port default port: {FLASK_PORT_DEFAULT} can be modified with the {PORT_VAR_NAME} environment variable"
    )
    print("\n")


def get_flask_host():
    flask_host = None
    dcm_host_env_var = os.getenv(HOST_VAR_NAME)

    if dcm_host_env_var is None or dcm_host_env_var == "":
        pass
    else:
        print(f"Using Env. Var {HOST_VAR_NAME}, value: {dcm_host_env_var}")
        flask_host = dcm_host_env_var

    return flask_host


def get_flask_port():
    flask_port = FLASK_PORT_DEFAULT

    dcm_port_env_var = os.getenv(PORT_VAR_NAME)
    dcm_port = flask_port

    try:
        if dcm_port_env_var is None or dcm_port_env_var == "":
            pass
        else:
            dcm_port = float(dcm_port_env_var)
            if dcm_port < 0 or dcm_port > 65535:
                print(
                    f"Env. Var {PORT_VAR_NAME} is out of range [0-65535]: {dcm_port_env_var}"
                )
            else:
                print(f"Using Env. Var {PORT_VAR_NAME}, value: {flask_port}")
                flask_port = dcm_port_env_var

    except ValueError:
        # If the input cannot be converted to a float, handle the exception
        print(f"Env. Var {PORT_VAR_NAME} is invalid: {dcm_port_env_var}")
