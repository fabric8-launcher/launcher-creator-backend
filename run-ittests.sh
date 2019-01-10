#!/bin/bash

set -e

BACKEND_CAPS_1="rest database welcome"
BACKEND_CAPS_2='rest database {"databaseType":"mysql"} welcome'
FRONTEND_CAPS="web-app welcome"

function run_all_tests() {
    run_test nodejs $BACKEND_CAPS_1
    run_test nodejs $BACKEND_CAPS_2
    run_test springboot $BACKEND_CAPS_1
    run_test springboot $BACKEND_CAPS_2
    run_test thorntail $BACKEND_CAPS_1
    run_test thorntail $BACKEND_CAPS_2
    run_test vertx $BACKEND_CAPS_1
    run_test vertx $BACKEND_CAPS_2

    run_test angular $FRONTEND_CAPS
    run_test react $FRONTEND_CAPS
}

function run_test() {
    set +e
    ${SCRIPT_DIR}/it-test/test-codebase.sh $@
    RES=$((RES + $?))
    set -e
}

function restore() {
    # Restore the original project as current
    if [[ "$PRJ" != "" ]]; then
        set +e
        oc project $PRJ > /dev/null
    fi
}

function restore_trap() {
    echo ""
    echo "Exiting..."
    restore
    exit 1
}

SCRIPT_DIR=$(cd "$(dirname "$BASH_SOURCE")" ; pwd -P)

RES=0

# Make sure we're connected to a cluster
oc whoami > /dev/null

# Remember the current project we're connected to (if any)
set +e
PRJ=$(oc project -q)
set -e

trap restore_trap INT

run_all_tests

restore

if [[ $RES == 0 ]]; then
    echo "Tests finished successfully"
else
    echo "Found $RES test failures"
fi

exit $RES

