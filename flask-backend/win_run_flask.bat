@echo off

SET PYTHONUNBUFFERED="1"

cd "src"
pipenv run flask --app main_server --debug run -p 5004
cd ..