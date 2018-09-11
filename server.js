#!/bin/env node
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const catalog = require('./lib/core/catalog');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
//app.options('*', cors());

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

const server = app.listen(8080, () => console.log('Server listening on port ', server.address().port));
