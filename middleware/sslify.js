// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const sslify = require('express-sslify');

module.exports = sslify.HTTPS(
  { trustAzureHeader: true }
);
