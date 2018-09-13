#!/usr/bin/env bash

ODO_URL=https://github.com/redhat-developer/odo/releases/download/v0.0.10/odo-linux-amd64.gz

curl -sSL ${ODO_URL} | gzip -d > ${HOME}/bin/odo
chmod +x ${HOME}/bin/odo
