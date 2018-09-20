#!/bin/bash

node node_modules/typescript/bin/tsc --project .
find lib/ -type f -name '*.json' -o -name '*.jar' | xargs cp --parents -t dist
find catalog/ -type f -name '*.json' -o -name '*.jar' | xargs cp --parents -t dist

