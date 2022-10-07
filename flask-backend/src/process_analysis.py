import re

class ScopeAnalysis:

    def __init__(self):

        self.results = {}

    def analyze(self, schema_objects_data):
        if('errorCode' in schema_objects_data):
            print("Error for ", schema_objects_data)
        else:
            objects_list = schema_objects_data['items']
            for object in objects_list:
                scope = object['scope']
                if(scope in self.results):
                    self.results[scope]['nb'] += 1
                else:
                    self.results[scope] = {'scope': scope, 'nb': 1}
                    
    def get_results(self):
        return self.results
    
class ScopeTypeAnalysis:

    def __init__(self):

        self.results = {}

    def analyze(self, schema_objects_data):
        if('errorCode' in schema_objects_data):
            print("Error for ", schema_objects_data)
        else:
            objects_list = schema_objects_data['items']
            for object in objects_list:
                scope = object['scope']
                
                scope_type = None
                
                regex_list = []
                
                regex_list.append(r'([A-Z]{1}[^-]*-)(.*)')
                regex_list.append(r'(metric-)(.*)')
                regex_list.append(r'(user-)(.*)')
                regex_list.append(r'([a-z\-][^:]*:)(.*)')
                regex_list.append(r'([a-z\-][^\.]*\.)(.*)')
                
                for regex in regex_list:
                    m = re.search(regex, scope)
                    
                    if(m == None):
                        print("Not Match: ", scope)
                    else:
                        scope_type = m.group(1)
                        break
                
                if(scope_type is None):
                    scope_type = scope
                
                if(scope_type in self.results):
                    self.results[scope_type]['nb'] += 1
                else:
                    self.results[scope_type] = {'scope': scope_type, 'nb': 1, 'example': scope}
                    
    def get_results(self):
        return self.results