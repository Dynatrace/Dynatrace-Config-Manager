env GOOS=darwin GOARCH=arm64 CGO_ENABLED=0 go build -a -tags netgo -ldflags '-X github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/version.MonitoringAsCode=2.x -w -extldflags "-static"' -o ./build/one-topology-darwin-arm64 ./cmd/monaco
cp -p ./build/one-topology-darwin-arm64 ../flask-backend/one-topology/one-topology-darwin-arm64
cp -p ./build/one-topology-darwin-arm64 ./bin/one-topology
