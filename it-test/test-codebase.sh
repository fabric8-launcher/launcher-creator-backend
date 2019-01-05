#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "$BASH_SOURCE")" ; pwd -P)

source ${SCRIPT_DIR}/helpers.sh

RUNTIME=$1
shift
CAPS=$@

echo "Testing runtime ${BLUE}$RUNTIME${RST} with ${BLUE}$CAPS${RST}"

# Setup
ITDIR=$(mktemp -d --tmpdir creator-it-XXXXXXXX)
PRJ=$(basename ${ITDIR,,})
oc new-project $PRJ > /dev/null

echo -n "   Creating project - "
OUT=$(yarn -s apply $ITDIR --runtime $RUNTIME ittest $CAPS 2>&1)
RES=$?
if [[ $RES == 0 ]]; then
    echo "${GREEN}ok${RST}"
    pushd $ITDIR > /dev/null
    ${SCRIPT_DIR}/build-and-test.sh $RUNTIME $CAPS
    RES=$?
    popd > /dev/null
else
    echo "${RED}failed${RST}"
    echo "$OUT"
fi

# Cleanup
oc delete project $PRJ > /dev/null
rm -rf $ITDIR

exit $RES

