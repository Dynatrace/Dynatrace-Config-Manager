@echo off

cd "src"
pipenv run cxfreeze -c main_server.py --target-dir ../../Dynatrace_Config_Manager-win64/app --target-name Dynatrace_Config_Manager-win64 --icon favicon.ico
cd ..
xcopy /Y /s one-topology\one-topology-windows-amd64.exe ..\Dynatrace_Config_Manager-win64\one-topology\
xcopy /Y /s terraform\dynatrace.com ..\Dynatrace_Config_Manager-win64\terraform\dynatrace.com /E /I