// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const express = require('express');
const app = express();
const initialize = require('./middleware/initialize');
const path = require('path');

app.initializeApplication = initialize.bind(undefined, app, express, __dirname);

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
