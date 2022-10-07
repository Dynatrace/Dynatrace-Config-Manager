import os
from os import listdir
from os.path import isfile, join


def get_file_path(dir_path, file_name, file_extension):
    return dir_path + '/' + file_name + '.' + file_extension


def get_data_dir():
    return prep_dir(os.getcwd() + '/../data')


def get_tenant_list_dir():
    return prep_dir(get_data_dir() + '/tenant')


def get_options_dir():
    return prep_dir(get_data_dir() + '/options')


def get_tenant_data_dir():
    return prep_dir(get_data_dir() + '/tenant_data')


def get_tenant_data_cache_dir(config):
    return prep_dir(get_tenant_data_dir() + '/' + config['tenant'])


def get_tenant_data_cache_sub_dir(config, sub_dir):
    return prep_dir(get_tenant_data_cache_dir(config) + '/' + sub_dir)


def get_log_list_dir():
    return prep_dir(get_data_dir() + '/log_list')


def get_log_data_dir(config):
    return prep_dir(get_log_list_dir(config) + '/log_data')


def prep_dir(path):
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)
    return path


def list_files_in_dir(path):
    files = [f for f in listdir(path) if isfile(join(path, f))]

    return files
