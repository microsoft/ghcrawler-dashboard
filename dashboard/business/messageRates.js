// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const moment = require('moment');
const Q = require('q');
const RedisMetricsClient = require('./redisMetricsClient');

const maxSec = 3600;

class MessageRates {
  constructor() {
  }

  initialize(config) {
    const serviceBusConfig = config.dashboard.serviceBus;
    this.queueNames = serviceBusConfig.messageRatesQueueNames;
    this.operations = serviceBusConfig.metricsOperationNames;
    this.queueNamePrefix = serviceBusConfig.queueNamePrefix;
    this.crawlerName = config.dashboard.crawler.name;
    this.metricsClient = new RedisMetricsClient(config);
  }

  getMessageRatesData(sec = maxSec) {
    const deferred = Q.defer();
    const numOfSec = parseInt(sec);
    const now = moment();
    const startTime = moment(now).subtract(numOfSec - 1, 'seconds');
    let stats = {
      time: [],
      data: {}
    };
    let isFirstTime = true;
    let promises = [];
    this.queueNames.forEach(queueName => {
      this.operations.forEach(operation => {
        const metricName = this.queueNamePrefix + ':' + queueName + ':' + operation;
        const displayedMetricName = queueName + ':' + operation;
        promises.push(this.metricsClient.getMetric(metricName, displayedMetricName, startTime, now));
      });
    });
    const metricName = `${this.crawlerName}:github:fetch`;
    const displayedMetricName = 'github:fetch';
    promises.push(this.metricsClient.getMetric(metricName, displayedMetricName, startTime, now));
    Q.all(promises).then(results => {
      results.forEach(result => {
        if (isFirstTime) {
          isFirstTime = false;
          stats.time = Object.keys(result.metric);
        }
        stats.data[result.name] = [];
        stats.time.forEach(timeSlot => {
          stats.data[result.name].push(result.metric[timeSlot]);
        });
      });
      deferred.resolve(stats);
    });
    return deferred.promise;
  }
}

module.exports = MessageRates;
