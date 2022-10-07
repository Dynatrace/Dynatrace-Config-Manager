export FLASK_APP=main_server
export FLASK_DEBUG=1
export PYTHONUNBUFFERED=1
export FLASK_PORT=5004

sh ./stop_flask.sh

cd src

pipenv run flask run -p $FLASK_PORT  > ../output.log 2>&1 &

cd ..

echo $! > flask_pid.txt

echo "\n"

tail -f output.log