cd "src"
python3 -m pipenv run cxfreeze -c main_server.py --target-dir ../../Dynatrace_Config_Manager-darwin_arm64/app --target-name Dynatrace_Config_Manager-darwin_arm64 --icon favicon.ico
cd ..
mkdir -p ../Dynatrace_Config_Manager-darwin_arm64/terraform/dynatrace.com/com/dynatrace/1.8.3/darwin_arm64
chmod +x terraform/terraform-provider-dynatrace_v1.8.3
cp -p terraform/terraform-provider-dynatrace_v1.8.3 ../Dynatrace_Config_Manager-darwin_arm64/terraform
