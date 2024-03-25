@echo off

call build.bat
xcopy /Y /s build\one-topology-windows-amd64.exe ..\Dynatrace_Config_Manager-win64\one-topology\
