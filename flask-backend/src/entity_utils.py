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

import re
import process_utils


def extract_type_from_entity_id(entity_id):
    
    matches = re.findall(r'([A-Z]{1}[^-]*)-(.*)', entity_id)
    entity_type = None
    for match in matches:
        entity_type, entity_id_only = match
        
    if(entity_type == None
       and entity_id in process_utils.UNIQUE_ENTITY_LIST):
        entity_type = entity_id

    return entity_type