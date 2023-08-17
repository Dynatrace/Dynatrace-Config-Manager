import os


def get_proxy_from_env():
    my_env = os.environ.copy()

    https_caps = "HTTPS_PROXY"

    if https_caps in my_env and my_env[https_caps] != "":
        return my_env[https_caps]

    return None


def apply_proxy_to_env_dict(env_dict, config):
    proxy_url = config["proxy"]
    proxy_keys = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"]

    if proxy_url and proxy_url != "":
        for proxy_key in proxy_keys:
            env_dict[proxy_key] = proxy_url
    else:
        for proxy_key in proxy_keys:
            if proxy_key in env_dict:
                del env_dict[proxy_key]

    return env_dict
