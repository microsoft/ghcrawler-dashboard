// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const express = require('express');
const corporateAuth = require('../middleware/corporateAuth.js');
const router = express.Router();

const routes = require('./routes/');

router.use(corporateAuth.corporateRoute);
router.use(routes);

module.exports = router;
