
class AnalysisFilter():

    def __init__(self, entity_type_list, time_from=None, time_to=None, time_filter_type=None):

        self.entity_type_list = entity_type_list

        if(time_from is None
           or time_to is None):

            self.do_time_filter = False

        else:

            self.do_time_filter = True
            self.time_filter_type = time_filter_type
            self.time_from = time_from
            self.time_to = time_to

    def set_time_filter_type(self, is_target_tenant):

        if(is_target_tenant == True):
            self.time_filter_type = 'firstSeenTms'
        else:
            self.time_filter_type = 'lastSeenTms'

    def is_type_selected(self, entity):

        return entity['type'] in self.entity_type_list

    def is_time_in_range(self, entity):

        if(self.time_filter_type is None):
            pass

        elif(self.do_time_filter == True):

            if(entity[self.time_filter_type] >= self.time_from
                    and entity[self.time_filter_type] <= self.time_to):

                pass

            else:
                return False

        return True

    def is_entity_seleted(self, entity):

        if(self.is_type_selected(entity)
           and self.is_time_in_range(entity)):

            return True

        else:

            return False
