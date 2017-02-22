// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const moment = require('moment');
const Q = require('q');
const RedisMetricsClient = require('./redisMetricsClient');

const maxSec = 3600;

class MessageRates {
  constructor(infoPoller) {
    this.infoPoller = infoPoller;
  }

  initialize(config, redisClient) {
    const queuingOptions = config.dashboard.queuing;
    this.queueNames = queuingOptions.messageRatesQueueNames;
    this.operations = queuingOptions.metricsOperationNames;
    this.crawlerName = config.dashboard.crawler.name;
    this.metricsClient = new RedisMetricsClient(redisClient);
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
      const info = this.infoPoller.infos[queueName];
      if (info && info.metricsName) {
        this.operations.forEach(operation => {
          const metricName = info.metricsName + ':' + operation;
          const displayedMetricName = queueName + ':' + operation;
          promises.push(this.metricsClient.getMetric(metricName, displayedMetricName, startTime, now));
        });
      }
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
