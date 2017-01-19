// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const uuid = require('node-uuid');

// ----------------------------------------------------------------------------
// Generate a correlation ID
// ----------------------------------------------------------------------------
module.exports = function (req, res, next) {
  req.correlationId = uuid.v4();
  next();
};
