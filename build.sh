#!/bin/bash

node node_modules/typescript/bin/tsc --project .

find lib/ -type f ! -name '*.ts' -exec sh -c 'mkdir -p "dist/$(dirname "{}")" && cp "{}" "dist/{}"' \;
find catalog/ -type f ! -name '*.ts' -exec sh -c 'mkdir -p "dist/$(dirname "{}")" && cp "{}" "dist/{}"' \;
