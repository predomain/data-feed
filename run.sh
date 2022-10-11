#!/bin/bash
DIR_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd $DIR_PATH/
$DIR_PATH/node_modules/.bin/ts-node --transpile-only $DIR_PATH/src/app.ts &
echo $! > node.pid

finish()
{
    kill $(cat node.pid)
    rm node.pid
    exit
}
trap finish SIGINT

while :; do
    sleep 1000
done