import compare


class Weight(dict):

    def add_weight(self, type_value, value):
        if(type_value in self):
            pass
        else:
            self[type_value] = 0

        self[type_value] += value

    def compare(self, other):

        list_type_value = compare.merge_lists(
            self.get_sorted_priorities(), other.get_sorted_priorities())

        return compare.compare_sorted_single_value_dict(list_type_value, self, other)

    def get_sorted_priorities(self):
        type_value_list = list(self.keys())
        type_value_list.sort()
        return type_value_list

