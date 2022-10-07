if test -f "./flask_pid.txt"; then
    export KILL_PID=`cat flask_pid.txt`
    while pkill -P $KILL_PID; do
        echo $KILL_PID
        sleep 1
    done
    rm flask_pid.txt
fi