'use strict';

const args=process.argv.slice(2);
const DB_NAME=args[0];
const SECRET_NAME=args[1];

require('.').deploy(DB_NAME, SECRET_NAME);
