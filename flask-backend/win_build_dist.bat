@echo off

cd "src"
pipenv run cxfreeze -c main_server.py --target-dir ../../Dynatrace_Config_Manager-win64/app --target-name Dynatrace_Config_Manager-win64 --icon favicon.ico
cd ..
xcopy /Y /s monaco\monaco-windows-amd64.exe ..\Dynatrace_Config_Manager-win64\monaco\
xcopy /Y /s terraform\terraform-provider-dynatrace_v1.8.3.exe ..\Dynatrace_Config_Manager-win64\terraform\