// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const utils = require('../utils');

module.exports = function (configApi) {
  const environmentProvider = configApi.environment;
  return {
    amqp: {
      connectionString: environmentProvider.get('CRAWLER_AMQP10_URL'),
    },
    serviceBus: {
      connectionString: environmentProvider.get('CRAWLER_SERVICEBUS_CONNECTION_STRING'),
      queueNamePrefix: environmentProvider.get('CRAWLER_QUEUE_PREFIX') || '',
      queueNames: utils.arrayFromString(environmentProvider.get('DASHBOARD_QUEUE_NAMES') || ['deadletter', 'immediate', 'later', 'normal', 'soon']),
      messageRatesQueueNames: utils.arrayFromString(environmentProvider.get('DASHBOARD_MESSAGE_RATES_QUEUE_NAMES') || ['immediate', 'later', 'normal', 'soon']),
      metricsOperationNames: utils.arrayFromString(environmentProvider.get('DASHBOARD_METRICS_OPERATION_NAMES') || ['push', 'repush', 'done', 'abandon']),
      pollingFrequencySec: environmentProvider.get('DASHBOARD_QUEUE_POLLING_FREQUENCY') || 5
    },
    configProvider: environmentProvider.get('DASHBOARD_CONFIG_PROVIDER') || 'redis'
  };
};
