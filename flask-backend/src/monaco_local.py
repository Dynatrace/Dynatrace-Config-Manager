import dirs
import json
import monaco_cli
import os


def get_path_entities_local(config):
    path = dirs.forward_slash_join(monaco_cli.get_path_entities(config), monaco_cli.project_name)
    return path


def analyze_entities(config, analysis_object):
    path_entities_local = get_path_entities_local(config)
    run_on_all_sub_files(path_entities_local, analysis_object)


def run_on_all_sub_files(path, analysis_object, file_extension=".json"):
    sub_dirs = os.scandir(path)

    for sub_dir in sub_dirs:
        if (sub_dir.is_dir()):
            sub_files = os.scandir(sub_dir)

            for sub_file in sub_files:
                if (file_extension in sub_file.path):
                    analyse_cached_json(analysis_object, sub_file)


def analyse_cached_json(analysis_object, sub_file):
    cached_data = None
    try:
        with open(sub_file, 'r', encoding='UTF-8') as f:
            cached_data = json.load(f)
    except FileNotFoundError as e:
        print("File name probably too long, try moving the tool closer to the root of the drive.")
        raise e

    if (analysis_object is None
            or cached_data is None):
        pass
    else:
        analysis_object.analyze(cached_data)
