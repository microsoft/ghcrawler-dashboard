// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const utils = require('../utils');

module.exports = function (configApi) {
  const environmentProvider = configApi.environment;
  return {
    crawler: {
      url: environmentProvider.get('CRAWLER_SERVICE_URL') || 'http://localhost:3000',
      apiToken: environmentProvider.get('CRAWLER_SERVICE_AUTH_TOKEN') || 'secret'
    },
    queuing: {
      queueNames: utils.arrayFromString(environmentProvider.get('DASHBOARD_QUEUE_NAMES') || ['immediate', 'later', 'normal', 'soon']),
      messageRatesQueueNames: utils.arrayFromString(environmentProvider.get('DASHBOARD_MESSAGE_RATES_QUEUE_NAMES') || ['immediate', 'later', 'normal', 'soon']),
      metricsOperationNames: utils.arrayFromString(environmentProvider.get('DASHBOARD_METRICS_OPERATION_NAMES') || ['push', 'done', 'abandon']),
      pollingFrequencySec: environmentProvider.get('DASHBOARD_QUEUE_POLLING_FREQUENCY') || 5
    }
  };
};
