'use strict';

const args=process.argv.slice(2);
const APP_NAME=args[0];
const COMPONENT_NAME=args[1];
const TARGET_DIR = args[2];

require('.').apply(APP_NAME, COMPONENT_NAME, TARGET_DIR);
