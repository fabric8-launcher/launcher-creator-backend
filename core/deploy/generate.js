'use strict';

const generate = require('.').generate;
const resources = require('resources').resources;

const args = process.argv.slice(2);

const resprom = Promise.resolve(resources({}));
resprom
    .then(res => generate(res, {secretName: args[1], databaseName: args[0]}))
    .then(res => console.dir(res, {depth:null}));
