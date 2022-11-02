@echo off

cd "src"
pipenv run cxfreeze -c main_server.py --target-dir ../../Dynatrace_Config_Manager-win64/app
cd ..