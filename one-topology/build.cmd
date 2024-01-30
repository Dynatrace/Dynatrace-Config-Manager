@echo off

SET GOARCH=amd64
SET GOOS=windows
SET CGO_ENABLED=0

go build -a -tags netgo -o ./build/one-topology-windows-amd64.exe ./cmd/monaco
xcopy /Y /s build\one-topology-windows-amd64.exe ..\flask-backend\one-topology\


SET GOARCH=arm64
SET GOOS=darwin
SET CGO_ENABLED=0

go build -a -tags netgo -o ./build/one-topology-darwin-arm64 ./cmd/monaco
