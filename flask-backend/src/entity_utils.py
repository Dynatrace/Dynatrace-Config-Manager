import re


def extract_type_from_entity_id(entity_id):
    print(entity_id)
    matches = re.findall(r'([A-Z]{1}[^-]*)-(.*)', entity_id)
    entity_type = None
    for match in matches:
        entity_type, entity_id = match

    return entity_type