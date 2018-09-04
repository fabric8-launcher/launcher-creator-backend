'use strict';

const me = require('.');
const printUsage = require("@core/info").printUsage;

const args = process.argv.slice(2);

if (args.length === 1 && args[0] === "--list") {
    process.stdout.write(`Available capabilities:\n`);
    me.listCapabilities().forEach(c => process.stdout.write(`    ${c.module.slice(14)}\n`));
    process.exit(0);
}

if (args.length === 2 && args[1] === "--help") {
    console.log("Usage: npm run -s apply -- <capability> <target_dir> [<capability_name>] [<json_props>]");
    printUsage(me.getCapabilityModule(args[0]).info());
    process.exit(0);
}

if (args.length < 2) {
    console.error("Missing arguments");
    console.log("Usage: npm run -s apply -- <capability> <target_dir> [<capability_name>] [<json_props>]");
    console.log("                        -- <capability> --help");
    console.log("                        -- --list");
    process.exit(1);
}

const CAP = args[0];
const TARGET_DIR = args[1];
const CAP_NAME = args[2] || CAP;
const PROPS = args[3] || "{}";

me.apply(TARGET_DIR, CAP, CAP_NAME, JSON.parse(PROPS))
    .catch(err => console.error(`Application Error: ${err}`));
