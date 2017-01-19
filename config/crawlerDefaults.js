// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const fs = require('fs');

module.exports = function (configApi) {
  const environmentProvider = configApi.environment;
  return {
    crawler: {
      name: environmentProvider.get('CRAWLER_NAME') || 'crawler',
      count: 0,
      pollingDelay: 5000,
      processingTtl: 60 * 1000,
      promiseTrace: false,
      orgList: _loadLines(environmentProvider.get('CRAWLER_ORGS_FILE') || '../orgs')
    },
    fetcher: {
      tokenLowerBound: 50,
      forbiddenDelay: 120000,
      metricsStore: 'redis',
      limitStore: 'memory',
      rate: 5
      // concurrency: 4
    },
    queuing: {
      weights: [3, 2, 3, 2],
      messageSize: 200,
      parallelPush: 10,
      metricsStore: 'redis',
      provider: environmentProvider.get('CRAWLER_QUEUE_PROVIDER') || 'amqp10',
      queueName: environmentProvider.get('CRAWLER_QUEUE_PREFIX') || 'crawler',
      events: {
        weight: 0,
        topic: environmentProvider.get('CRAWLER_EVENT_TOPIC_NAME') || 'crawler',
        queueName: environmentProvider.get('CRAWLER_EVENT_QUEUE_NAME') || 'crawler'
      },
      attenuation: {
        ttl: 3000
      },
      tracker: {
        // driftFactor: 0.01,
        // retryCount: 3,
        // retryDelay: 200,
        // locking: true,
        // lockTtl: 1000,
        ttl: 60 * 60 * 1000
      },
      credit: 100
    },
    storage: {
      ttl: 6 * 1000,
      provider: environmentProvider.get('CRAWLER_STORE_PROVIDER') || 'azure'
    },
    locker: {
      provider: 'redis',
      retryCount: 3,
      retryDelay: 200
    }
  };
};

function _loadLines(path) {
  if (!path || !fs.existsSync(path)) {
    return [];
  }
  let result = fs.readFileSync(path, 'utf8');
  result = result.split(/\s/);
  return result.filter(line => { return line; }).map(line => { return line.toLowerCase(); });
}