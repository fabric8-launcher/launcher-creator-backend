'use strict';

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error("Missing aruments");
    console.error("Usage: npm run apply -- <target_dir> <application_name> [<capability_name>] [<database_type>] [<runtime>]");
    return;
}

const TARGET_DIR = args[0];
const APP_NAME = args[1];
const CAP_NAME = args[2];
const DB_TYPE = args[3] || "postgresql";
const RUNTIME = args[4] || "thorntail";

require('.').apply(APP_NAME, TARGET_DIR, { id: CAP_NAME, databaseType: DB_TYPE });
