# Copyright 2022 Dynatrace LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#      https://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from distutils import extension
import json
import os


def get_cached_data(use_cache, cache_only, cache_path, log_label, extract_function, is_json=True):

    data = None
    extract_data_from_api = True
    
    if (use_cache):
        if (os.path.exists(cache_path)):
            with open(cache_path, 'rb') as f:
                
                if(is_json):
                    data = json.load(f)
                else:
                    data = f.read()
                    
            print("Loaded from cache: ", log_label)
            extract_data_from_api = False

        elif(cache_only):
            print("Not part of cache", log_label, '\n', cache_path)
            extract_data_from_api = False
            data = None
               

    if(extract_data_from_api == True):
        print("Extracting:        ", log_label)
        
        data = extract_function()

        write_mode = None
        if(is_json):
            write_mode = 'w'
        else:
            write_mode = 'wb'

        with open(cache_path, write_mode) as f:
            
            if(is_json):
                f.write(json.dumps(data))
            else:
                f.write(data)
    
    return data
