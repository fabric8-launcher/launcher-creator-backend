#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "$BASH_SOURCE")" ; pwd -P)

source ${SCRIPT_DIR}/helpers.sh

RUNTIME=$1
shift
CAPS=$@

# First we deploy project to the cluster
echo -n "   Deploying project - "
OUT=$(./gap deploy 2>&1)
RES=$?
if [[ $RES != 0 ]]; then
    echo "${RED}failed${RST}"
    echo "$OUT"
    exit 1
else
    echo "${GREEN}ok${RST}"
fi

# Then we build the project locally
echo -n "   Building project - "
OUT=$(./gap build 2>&1)
RES=$?
if [[ $RES != 0 ]]; then
    echo "${RED}failed${RST}"
    echo "$OUT"
    exit 1
else
    echo "${GREEN}ok${RST}"
fi

# Then we push the code to the cluster
echo -n "   Pushing project - "
OUT=$(./gap push 2>&1)
RES=$?
if [[ $RES != 0 ]]; then
    echo "${RED}failed${RST}"
    echo "$OUT"
    exit 1
else
    echo "${GREEN}ok${RST}"
fi

# Now we wait for the service to become available (max 15 min)

# First we cancel the first build which will fail anyway
oc cancel-build ittest-1 2>&1 > /dev/null
# Then we wait for the second build to complete or fail
echo -n "   Waiting for build "
for i in $(seq 1 60); do
    OUT=$(oc get build/ittest-2 --template {{.status.phase}} 2>&1) 
    RES=$?
    if [[ $RES == 0 ]]; then
        case $OUT in
            [Nn]ew)
                echo -n "N"
                sleep 15
                ;;
            [Pp]ending)
                echo -n "P"
                sleep 15
                ;;
            [Rr]unning)
                echo -n "."
                sleep 15
                ;;
            [Cc]omplete)
                echo " ${GREEN}ok${RST}"
                break
                ;;
            *)
                echo " ${RED}failed${RST}"
                exit 1
        esac
    else
        echo " ${RED}failed${RST}"
        echo "$OUT"
        exit 1
    fi
done
# Then we wait for the deployment to spin up our application
echo -n "   Waiting for deployment "
for i in $(seq 1 60); do
    echo -n "."
    OUT=$(oc wait dc/ittest --timeout=15s --for condition=available 2>&1)
    RES=$?
    if [[ $RES == 0 ]]; then break; fi
done
if [[ $RES != 0 ]]; then
    echo " ${RED}failed${RST}"
    echo "$OUT"
    exit 1
else
    echo " ${GREEN}ok${RST}"
fi
# And we sleep for a while because if we don't we still often fail *sigh*
sleep 5

# And finally we run all the tests

for cap in $CAPS; do
    echo "   Testing capability ${BLUE}$cap${RST}"
    shopt -s nullglob
    for script in ${SCRIPT_DIR}/cap-test/$cap/test-*.sh; do
        echo -n "      [$(basename $script)] - "
        OUT=$($script 2>&1)
        SRES=$?
        if [[ $SRES == 0 ]]; then
            echo "${GREEN}ok${RST}"
        else
            echo "${RED}failed${RST}"
            echo "$OUT"
            RES=$((RES + 1))
        fi
    done
done

exit $RES

