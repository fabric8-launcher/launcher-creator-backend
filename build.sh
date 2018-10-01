#!/bin/bash

node node_modules/typescript/bin/tsc --project .

find lib/ \( -type f -name '*.json' -o -name '*.jar' \) -exec sh -c 'mkdir -p dist/$(dirname {}) && cp {} dist/{}' \;
find catalog/ \( -type f -name '*.json' -o -name '*.jar' \) -exec sh -c 'mkdir -p dist/$(dirname {}) && cp {} dist/{}' \;