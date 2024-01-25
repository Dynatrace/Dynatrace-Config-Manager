cd "src"
pipenv run cxfreeze -c main_server.py --target-dir ../../Dynatrace_Config_Manager-linux64/app --target-name Dynatrace_Config_Manager-linux64 --icon favicon.ico
cd ..
mkdir -p ../Dynatrace_Config_Manager-linux64/terraform/dynatrace.com/com/dynatrace/1.8.3/linux_amd64
cp -p -r terraform/dynatrace.com/com/dynatrace/1.8.3/linux_amd64 ../Dynatrace_Config_Manager-linux64/terraform/dynatrace.com/com/dynatrace/1.8.3