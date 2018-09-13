#!/usr/bin/env bash

OC_URL=https://github.com/openshift/origin/releases/download/v3.10.0/openshift-origin-client-tools-v3.10.0-dd10d17-linux-64bit.tar.gz

mkdir -p ${HOME}/bin
curl -sSL ${OC_URL} | tar xzC ${HOME}/bin --strip-components 1
