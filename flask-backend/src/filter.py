
class AnalysisFilter():

    def __init__(self, entity_type_list, time_from=None, time_to=None):

        self.accept_all_types = True
        self.entity_type_list = entity_type_list
        '''
        self.entity_type_excluded = ['EC2_INSTANCE', 'SERVICE_INSTANCE', 'PROCESS_GROUP_INSTANCE',
                                     'CONTAINER_GROUP_INSTANCE', 'SERVICE_METHOD_GROUP', 'DISK', 'os:service', 'APPLICATION_METHOD_GROUP',
                                     'cloud:gcp:k8s_container', 'NETWORK_INTERFACE']
        '''
        self.entity_type_excluded = []
        print("TODO: Review entity matching for performance, use sorted arrays, not maps, by then, we are excluding some entities from matching, excluded types are: ", self.entity_type_excluded)

        if (time_from is None
           or time_to is None):

            self.do_time_filter = False

        else:

            self.do_time_filter = True
            self.is_target_tenant = None
            self.time_filter_type = None
            self.time_from = time_from
            self.time_to = time_to

    def set_target_tenant(self, is_target_tenant):

        self.is_target_tenant = is_target_tenant

        if (self.is_target_tenant == True):
            self.time_filter_type = 'firstSeenTms'
        else:
            self.time_filter_type = None

    def is_type_selected(self, entity):

        if (self.accept_all_types == True):
            pass
        elif (entity['type'] in self.entity_type_list):
            pass
        else:
            return False

        if (entity['type'] in self.entity_type_excluded):
            return False

        return True

    def is_time_in_range(self, entity):

        if (self.time_filter_type is None):
            pass

        elif (self.do_time_filter == True):

            if (entity[self.time_filter_type] >= self.time_from
                    and entity[self.time_filter_type] <= self.time_to):

                pass

            else:
                return False

        return True

    def is_entity_seleted(self, entity):

        if (self.is_type_selected(entity)
           and self.is_time_in_range(entity)):

            return True

        else:

            return False
