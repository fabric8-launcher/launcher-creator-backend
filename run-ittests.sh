#!/bin/bash

set -e

BACKEND_CAPS="rest database welcome"
FRONTEND_CAPS="web-app welcome"

function run_all_tests() {
    run_test nodejs $BACKEND_CAPS
    run_test springboot $BACKEND_CAPS
    run_test thorntail $BACKEND_CAPS
    run_test vertx $BACKEND_CAPS

    run_test angular $FRONTEND_CAPS
    run_test react $FRONTEND_CAPS
}

function run_test() {
    set +e
    ${SCRIPT_DIR}/it-test/test-codebase.sh $@
    RES=$((RES + $?))
    set -e
}

SCRIPT_DIR=$(cd "$(dirname "$BASH_SOURCE")" ; pwd -P)

RES=0

# Make sure we're connected to a cluster
oc whoami > /dev/null

# Remember the current project we're connected to (if any)
set +e
PRJ=$(oc project -q)
set -e

run_all_tests

# Restore the original project as current
if [[ "$PRJ" != "" ]]; then
    set +e
    oc project $PRJ > /dev/null
fi

if [[ $RES == 0 ]]; then
    echo "Tests finished successfully"
else
    echo "Found $RES test failures"
fi

exit $RES

