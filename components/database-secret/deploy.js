'use strict';

const args=process.argv.slice(2);
const SECRET_NAME=args[0];
const DB_NAME=args[1];

require('.').deploy(SECRET_NAME, DB_NAME);
