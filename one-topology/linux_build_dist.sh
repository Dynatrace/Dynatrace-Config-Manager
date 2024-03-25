easyjson -all -omit_empty C:\win-repos\Dynatrace-Config-Manager\one-topology\pkg\match\entities\values\testValuesList.go
env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -tags netgo -ldflags '-X github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/version.MonitoringAsCode=2.x -w -extldflags "-static"' -o ./build/one-topology-linux-amd64 ./cmd/monaco
mkdir -p ../Dynatrace_Config_Manager-linux64/one-topology/
cp -p ./build/one-topology-linux-amd64 ../Dynatrace_Config_Manager-linux64/one-topology/
