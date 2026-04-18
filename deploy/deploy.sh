#!/bin/bash
set -e

cd "$(dirname "$0")/.."

LOCAL_DIR=./
PROJECT_NAME=$(basename "$PWD")
SERVER_DIR=/vserver/projects/$PROJECT_NAME
DEV_SERVER=14.225.255.170
USER=root

echo "Deploying $PROJECT_NAME to $USER@$DEV_SERVER"
echo

echo "Build..."
npm install
npm run build
echo

echo "Ensure remote dir exists..."
ssh $USER@$DEV_SERVER "mkdir -p $SERVER_DIR"
echo

echo "Rsync..."
rsync -av --delete $LOCAL_DIR/build/ $USER@$DEV_SERVER:$SERVER_DIR/
echo

echo "Done!"