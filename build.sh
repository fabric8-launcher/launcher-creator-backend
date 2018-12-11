#!/bin/bash

rm -rf dist

node node_modules/typescript/bin/tsc --project .

cp -a lib dist/
cp -a catalog dist/

