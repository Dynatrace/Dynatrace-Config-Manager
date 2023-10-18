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

from deepdiff import DeepDiff


def merge_lists(list_first, list_second):
    set_first = set(list_first)
    set_second = set(list_second)

    set_only_in_second = set_second - set_first

    merged_list = list_first + list(set_only_in_second)
    merged_list.sort()

    return merged_list


def compare_sorted_single_value_dict(list_key, dict_first, dict_second):

    list_key.sort(reverse=True)

    for type_value in list_key:

        if (type_value in dict_first):

            if (type_value in dict_second):

                if (dict_first[type_value] == dict_second[type_value]):
                    continue
                else:
                    return dict_first[type_value] - dict_second[type_value]

            else:
                return dict_first[type_value] - 0

        else:
            if (type_value in dict_second):
                return 0 - dict_second[type_value]
            else:
                continue

    return 0


def get_top_matches(input_dict, weight_property):

    best_weight = None
    best_matches = {}

    for key, sub_dict in input_dict.items():

        if (best_weight is None):
            compare_value = 1

        else:
            compare_value = sub_dict[weight_property].compare(best_weight)

        if (compare_value >= 1):
            best_weight = sub_dict[weight_property]
            best_matches = {}

        if (compare_value >= 0):
            best_matches[key] = sub_dict

    return best_matches


def is_deeply_different(object1, object2):
    ddiff = DeepDiff(object1, object2, ignore_order=True)

    deeply_different = True

    if (ddiff == {}):
        deeply_different = False

    return deeply_different
