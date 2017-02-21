// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const Q = require('q');
const moment = require('moment');
const RedisMetrics = require('redis-metrics');

class RedisMetricsClient {
  constructor(redisClient) {
    this.redisMetrics = new RedisMetrics({ client: redisClient });
  }

  getMetric(name, displayedMetricName, startTime, endTime) {
    const counter = this.redisMetrics.counter(name, { namespace: 'crawlermetrics' }); // Stored in Redis as {namespace}:{name}:{period}
    const durationSec = endTime.diff(startTime, 'seconds');
    const timeGranularity = (durationSec > 600) ? 'minute' : 'second';
    if (durationSec < 60) {
      endTime = moment(endTime).subtract(1, 'second'); // Skip current data point not to confuse the viewer since typically the current time period is not complete
      startTime = moment(startTime).subtract(1, 'second');
    }
    if (durationSec >= 60 && durationSec < 600) {
      endTime = moment(endTime).subtract(5, 'second'); // Skip current data point not to confuse the viewer since typically the current time period is not complete
      startTime = moment(startTime).subtract(5, 'second');
    }
    if (durationSec >= 600) {
      endTime = moment(endTime).subtract(1, 'minutes'); // Skip current data point not to confuse the viewer since typically the current time period is not complete
      startTime = moment(startTime).subtract(1, 'minutes');
    }
    return counter.countRange(timeGranularity, startTime, endTime)
      .then(metric => { // Example: { '2015-04-15T11:00:00+00:00': 2, '2015-04-15T12:00:00+00:00': 3 }
        if (durationSec >= 60 && durationSec < 600) {
          metric = this._reduceMetric(metric, 5);
        }
        if (durationSec >= 600) {
          metric = this._scaleMetric(metric, 60);
        }
        const result = {
          name: displayedMetricName,
          metric: metric
        };
        return Q(result);
      });
  }

  _reduceMetric(metric, reduceBy = 5) {
    let reducedMetric = {};
    let intermediateCount = 0;
    const times = Object.keys(metric);
    times.forEach((time, index) => {
      if ((index + 1) % reduceBy === 0) {
        let average = Math.round(intermediateCount / reduceBy);
        reducedMetric[time] = average;
        intermediateCount = 0;
      } else {
        intermediateCount += metric[time];
      }
    });
    return reducedMetric;
  }

  _scaleMetric(metric, scaleBy = 60) {
    let scaledMetric = {};
    const times = Object.keys(metric);
    times.forEach(time => {
      let currentValue = metric[time];
      scaledMetric[time] = Math.round(currentValue / scaleBy);
    });
    return scaledMetric;
  }
}

module.exports = RedisMetricsClient;
