// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const Q = require('q');

const maxSec = 3600;

class ServiceBusStatsPoller {
  constructor() {
    this.stats = {
      time: [],
      data: {}
    };
  }

  initialize(config, serviceBusClient) {
    const serviceBusConfig = config.dashboard.serviceBus;
    this.queueNamePrefix = serviceBusConfig.queueNamePrefix;
    this.queueNames = serviceBusConfig.queueNames;
    this.queueNames.forEach(queueName => {
      this.stats.data[queueName] = [];
    });
    this.pollingFrequencySec = serviceBusConfig.pollingFrequencySec;
    this.maxNumberOfDataPoints = Math.floor(maxSec / this.pollingFrequencySec);
    this.serviceBusClient = serviceBusClient;
  }

  getQueuesActiveMessageCountsData(sec = maxSec) {
    const numOfSec = parseInt(sec);
    if (numOfSec > 0 && numOfSec < maxSec) {
      const maxNumberOfDataPointsToReturn = Math.floor(numOfSec / this.pollingFrequencySec);
      if (this.stats.time.length <= maxNumberOfDataPointsToReturn) {
        return this.stats;
      }
      const time = this.stats.time.slice(this.stats.time.length - maxNumberOfDataPointsToReturn);
      let data = {};
      this.queueNames.forEach(queueName => {
        data[queueName] = this.stats.data[queueName].slice(this.stats.data[queueName].length - maxNumberOfDataPointsToReturn);
      });
      return {
        time: time,
        data: data
      };
    }
    return this.stats;
  }

  getMessageCount(queueName) {
    if (!this.serviceBusClient) {
      return Q.reject(new Error('Service bus is not configured.'));
    }
    const deferred = Q.defer();
    this.serviceBusClient.getQueue(queueName, (err, queue) => {
      if (err) {
        deferred.reject(err);
      } else {
        // length of queue (active messages ready to read)
        let activeMessageCount;
        try {
          activeMessageCount = queue.CountDetails['d2p1:ActiveMessageCount'];
        } catch (error) {
          activeMessageCount = 0;
        }
        deferred.resolve(activeMessageCount);
      }
    });
    return deferred.promise;
  }

  startCollectingData() {
    this.intervalId = setInterval(() => {
      this.stats.time.push(new Date());
      if (this.stats.time.length > this.maxNumberOfDataPoints) {
        this.stats.time.shift();
      }
      const self = this;
      self.queueNames.forEach(queueName => {
        self.getMessageCount(`${self.queueNamePrefix}-${queueName}`).then(messageCount => {
          self.stats.data[queueName].push(parseInt(messageCount));
          if (self.stats.data[queueName].length > self.maxNumberOfDataPoints) {
            self.stats.data[queueName].shift();
          }
        }).catch(() => {
          self.stats.data[queueName].push(0);
          if (self.stats.data[queueName].length > self.maxNumberOfDataPoints) {
            self.stats.data[queueName].shift();
          }
        });
      });
    }, this.pollingFrequencySec * 1000);
  }

  stopCollectingData() {
    clearInterval(this.intervalId);
  }
}

module.exports = ServiceBusStatsPoller;
