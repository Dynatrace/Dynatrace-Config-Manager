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

import os_helper


def create_shell_command(cmd_list, cwd):
    if os_helper.IS_WINDOWS:
        return cmd_list, cwd

    cwd_command = f"cd {cwd}"

    commands = f"""{cwd_command}
{" ".join(cmd_list)}"""

    return commands, None
