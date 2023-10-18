import os

FLASK_PORT = 3004
FLASK_HOST = None

DCM_PORT_ENV_VAR = os.getenv("DCM_PORT")
DCM_PORT = FLASK_PORT

print("\nEnvironment variables:")
print("\n  DCM_PORT:")
print(
    f"    - The port default port: {FLASK_PORT} can be modified with the DCM_PORT environment variable"
)
print("\n  DCM_HOST:")
print("    - Right now, the server will be only available on localhost, as it is safer")
print(
    "    - To make it available from other computers, you could set the DCM_HOST environment variable to the ip address zero: 0.0.0.0"
)
print("\n")

try:
    if DCM_PORT_ENV_VAR is None or DCM_PORT_ENV_VAR == "":
        pass
    else:
        DCM_PORT = float(DCM_PORT_ENV_VAR)
        if DCM_PORT < 0 or DCM_PORT > 65535:
            print(f"Env. Var DCM_PORT is out of range [0-65535]: {DCM_PORT_ENV_VAR}")
        else:
            print(f"Using Env. Var DCM_PORT, value: {FLASK_PORT}")
            FLASK_PORT = DCM_PORT_ENV_VAR

except ValueError:
    # If the input cannot be converted to a float, handle the exception
    print(f"Env. Var DCM_PORT is invalid: {DCM_PORT_ENV_VAR}")


DCM_HOST_ENV_VAR = os.getenv("DCM_HOST")
if DCM_PORT_ENV_VAR is None or DCM_PORT_ENV_VAR == "":
    pass
else:
    print(f"Using Env. Var DCM_HOST, value: {DCM_HOST_ENV_VAR}")
    FLASK_HOST = DCM_HOST_ENV_VAR
