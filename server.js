#!/bin/env node
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const catalog = require('./lib/core/catalog');
const deploy = require('./lib/core/deploy');
const { resources } = require('./lib/core/resources');
const { join } =  require('path');

const tmp = require('tmp');
tmp.setGracefulCleanup();

const Archiver = require('archiver');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
//app.options('*', cors());

app.get('/', (req, res) => {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl + 'swagger.yaml';
    res.redirect(`${req.protocol}://editor.swagger.io/?url=${url}`);
});

app.use('/swagger.yaml', express.static('./swagger.yaml'));

app.get('/capabilities', (req, res) => {
    catalog.listCapabilities()
        .then(caps => res.status(200).send(caps))
        .catch(err => res.status(500).send(err));
});

app.get('/generators', (req, res) => {
    catalog.listGenerators()
        .then(caps => res.status(200).send(caps))
        .catch(err => res.status(500).send(err));
});

app.get('/runtimes', (req, res) => {
    catalog.listRuntimes()
        .then(list => res.status(200).send(list))
        .catch(err => res.status(500).send(err));
});

app.get('/create', (req, res) => {
    // Create temp dir
    tmp.dir({unsafeCleanup: true},function (err,tempDir, cleanTempDir) {
        // Generate contents TODO: Use request parameters
        deploy.apply('my-database', resources({}), tempDir, 'database', { "databaseType" : 'mysql', 'runtime':  'vertx' })
           .then(() => {
                // Tell the browser that this is a zip file.
                res.writeHead(200, {
                   'Content-Type': 'application/zip',
                   'Content-disposition': 'attachment; filename=app.zip'
                });
                let zip = Archiver('zip');
                // good practice to catch this error explicitly
                zip.on('error', function(err) {
                   throw err;
                });
                // Send the file to the page output.
                zip.pipe(res);
                // append files from tempDir, putting its contents at the root of archive
                zip.directory(tempDir, false);
                zip.finalize();
           })
           .catch(err => res.status(500).send(err));
    });
});

const server = app.listen(8080, () => console.log('Server listening on port ', server.address().port));
