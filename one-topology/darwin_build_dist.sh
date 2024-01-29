env GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -a -tags netgo -ldflags '-X github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/version.MonitoringAsCode=2.x -w -extldflags "-static"' -o ./build/one-topology-darwin_arm64 ./cmd/monaco
mkdir -p ../Dynatrace_Config_Manager-darwin_arm64/one-topology/
cp -p ./build/one-topology-darwin_arm64 ../Dynatrace_Config_Manager-darwin_arm64/one-topology/
