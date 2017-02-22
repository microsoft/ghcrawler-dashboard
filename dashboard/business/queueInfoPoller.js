// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const CrawlerClient = require('crawler-cli');

const maxSec = 3600;

class QueueInfoPoller {
  constructor() {
    this.stats = {
      time: [],
      data: {}
    };
    this.infos = {};
    this.crawlerName = null;
  }

  initialize(config) {
    this.crawlerClient = new CrawlerClient(config.dashboard.crawler.url, config.dashboard.crawler.apiToken);
    this.queueNames = config.dashboard.queuing.queueNames;
    this.queueNames.forEach(queueName => {
      this.stats.data[queueName] = [];
    });
    this.pollingFrequencySec = config.dashboard.queuing.pollingFrequencySec;
    this.maxNumberOfDataPoints = Math.floor(maxSec / this.pollingFrequencySec);
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

  startCollectingData() {
    this.intervalId = setInterval(() => {
      this.stats.time.push(new Date());
      if (this.stats.time.length > this.maxNumberOfDataPoints) {
        this.stats.time.shift();
      }
      const self = this;
      self.queueNames.forEach(queueName => {
        self.crawlerClient.getInfo(`${queueName}`).then(info => {
          self.infos[queueName] = info;
          self.stats.data[queueName].push(parseInt(info.count));
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

module.exports = QueueInfoPoller;
