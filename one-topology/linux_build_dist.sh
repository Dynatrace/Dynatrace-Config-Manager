env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -tags netgo -ldflags '-X github.com/dynatrace/dynatrace-configuration-as-code/pkg/version.MonitoringAsCode=2.x -w -extldflags "-static"' -o ./build/one-topology-linux-amd64 ./cmd/monaco
mkdir -p ../Dynatrace_Config_Manager-linux64/one-topology/
cp -p ./build/one-topology-linux-amd64 ../Dynatrace_Config_Manager-linux64/one-topology/