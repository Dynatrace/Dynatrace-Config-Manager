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