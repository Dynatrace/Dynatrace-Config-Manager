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

def write_lines_to_file(path, lines):
    lines = add_line_changes(lines)

    with open(path, "w", encoding='UTF-8') as f:
        f.writelines(lines)


def add_line_changes(lines):
    lines_modified = []

    for line in lines:
        lines_modified.append(line + "\n")

    return lines_modified
