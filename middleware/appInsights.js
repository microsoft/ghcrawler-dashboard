// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const colors = require('colors');
const debug = require('debug')('appinsights');

module.exports = function initializeAppInsights(app, config) {
  const key = config && config.telemetry && config.telemetry.applicationInsightsKey ? config.telemetry.applicationInsightsKey : null;
  let client = {};
  if (key) {
    const appInsights = require('applicationinsights');
    appInsights.setup(key)
      .setAutoCollectPerformance(false)
      .start();
    client = appInsights.defaultClient;
  } else {
    client.trackEvent = (msg) => debug(colors.yellow(msg.name) + JSON.stringify(msg.properties));
    client.trackException = (msg) => debug(colors.red(msg.exception) + JSON.stringify(msg.properties));
    client.trackMetric = (msg) => debug(colors.blue(msg.name) + msg.value);
    client.trackTrace = (msg) => debug(colors.green(msg.message));
  }

  app.use((req, res, next) => {
    req.insights = client;
    next();
  });

  return client;
};
