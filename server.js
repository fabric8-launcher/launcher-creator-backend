#!/bin/env node
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const catalog = require("./core/catalog");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/capabilities", (req, res) => {
    catalog.listCapabilities().then(caps => res.status(200).send(caps));
});

app.get("/generators", (req, res) => {
    catalog.listGenerators().then(caps => res.status(200).send(caps));
});

const server = app.listen(8080, () => console.log("Server listening on port ", server.address().port));
