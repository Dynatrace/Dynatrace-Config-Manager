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

from cx_Freeze import setup, Executable

# Include the name of all folder or files in your project folder that are nessesary for the project excluding your main flask file.
# If there are multiple files, you can add them into a folder and then specify the folder name.

includefiles = [ ]
includes = [ './' ] 
excludes = [ ]

setup(
 name='Dynatrace-Config-Manager',
 version = '0.1',
 description = 'Dynatrace-Config-Manager',
 options = {'build_exe':   {'excludes':excludes,'include_files':includefiles, 'includes':includes}},
 executables = [Executable('main_server.py')], 
 requires=['flask']
)

# In place of main.py file add your main flask file name