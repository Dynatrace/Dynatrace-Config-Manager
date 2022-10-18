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