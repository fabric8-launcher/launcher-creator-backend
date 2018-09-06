#!/bin/env node
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const catalog = require("launcher-creator-catalog");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/capabilities", (req, res) => {
    res.status(200).send(catalog.listCapabilities());
});

app.get("/generators", (req, res) => {
    res.status(200).send(catalog.listGenerators());
});

const server = app.listen(8080, () => console.log("Server listening on port ", server.address().port));
