// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const hsts = require('hsts');

module.exports = hsts({
  maxAge: 10886400000,     // Must be at least 18 weeks to be approved
  includeSubDomains: true, // Must be enabled to be approved
  preload: true,
});
