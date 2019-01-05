#!/bin/bash

set -e

HST=$(oc get route ittest  --template={{.spec.host}})
OUT=$(curl -s "$HST/api/greeting?name=Tako") 
if [[ "$OUT" != *"Hello, Tako!"* ]]; then
    echo "Fail: unexpected result: $OUT"
    exit 1
fi

