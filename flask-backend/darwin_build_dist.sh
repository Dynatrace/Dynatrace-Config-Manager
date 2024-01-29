cd "src"
pipenv run cxfreeze -c main_server.py --target-dir ../../Dynatrace_Config_Manager-darwin_arm64/app --target-name Dynatrace_Config_Manager-darwin_arm64 --icon favicon.ico
cd ..
mkdir -p ../Dynatrace_Config_Manager-darwin_arm64/terraform/dynatrace.com/com/dynatrace/1.8.3/darwin_arm64
cp -p -r terraform/dynatrace.com/com/dynatrace/1.8.3/darwin_arm64 ../Dynatrace_Config_Manager-darwin_arm64/terraform/dynatrace.com/com/dynatrace/1.8.3