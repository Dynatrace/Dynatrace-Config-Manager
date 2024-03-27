easyjson -all -omit_empty ~/repos/Dynatrace-Config-Manager/one-topology/pkg/match/entities/values/raw_entity_list.go
env GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -a -tags netgo -ldflags '-X github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/version.MonitoringAsCode=2.x -w -extldflags "-static"' -o ./build/one-topology-windows-amd64.exe ./cmd/monaco
env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -tags netgo -ldflags '-X github.com/Dynatrace/Dynatrace-Config-Manager/one-topology/pkg/version.MonitoringAsCode=2.x -w -extldflags "-static"' -o ./build/one-topology-linux-amd64 ./cmd/monaco
cp -p ./build/one-topology-linux-amd64 ../flask-backend/one-topology/one-topology-linux-amd64
cp -p ./build/one-topology-linux-amd64 ./bin/one-topology
