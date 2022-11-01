@echo off

cd "src"
pipenv run cxfreeze -c main_server.py --target-dir ../../dist
cd ..