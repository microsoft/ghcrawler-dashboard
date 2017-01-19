// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const insights = require('../lib/insights');

module.exports = function initializeAppInsights(app, config) {
  let client = undefined;
  const key = config && config.telemetry && config.telemetry.applicationInsightsKey ? config.telemetry.applicationInsightsKey : null;
  if (key) {
    const appInsights = require('applicationinsights');
    const instance = appInsights.setup(key);
    client = instance.getClient(key);
    instance.start();
  }

  app.use((req, res, next) => {
    // Provide application insight event tracking with correlation ID
    const extraProperties = {
      correlationId: req.correlationId,
    };
    req.insights = insights(extraProperties, client);
    next();
  });

  return insights({}, client);
};
