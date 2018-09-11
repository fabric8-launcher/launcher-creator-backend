#!/bin/env node
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const catalog = require('./core/catalog');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
//app.options('*', cors());

app.get('/capabilities', (req, res) => {
    catalog.listCapabilities().then(caps => res.status(200).send(caps));
});

app.get('/generators', (req, res) => {
    catalog.listGenerators().then(caps => res.status(200).send(caps));
});

app.get('/runtimes', (req, res) => {
    const runtimes = [
        {
            "id": "nodejs",
            "name": "Node.js"
        },
        {
            "id": "springboot",
            "name": "Spring Boot"
        },
        {
            "id": "thorntail",
            "name": "Thorntail"
        },
        {
            "id": "vertx",
            "name": "Vert.x"
        }
    ];
    res.status(200).send(runtimes);
});

const server = app.listen(8080, () => console.log('Server listening on port ', server.address().port));
