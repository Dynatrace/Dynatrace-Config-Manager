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

