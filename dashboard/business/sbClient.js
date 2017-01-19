// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const Q = require('q');

class ServiceBusClient {
  constructor() {
  }

  initialize(config, serviceBusClient) {
    this.config = config;
    this.serviceBusClient = serviceBusClient;
  }

  getRequests(queue, count, remove = false) {
    if (!this.serviceBusClient) {
      return Q.reject(new Error('Service bus is not configured.'));
    }
    const queueName = `${this.config.dashboard.serviceBus.queueNamePrefix}-${queue}`;
    const result = [];
    for (let i = 0; i < count; i++) {
      // use deferred and promises here to maintain order.  If the callback pushed on the result,
      // we'd get completion order not actual order
      const deferred = Q.defer();
      this.serviceBusClient.receiveQueueMessage(queueName, { isPeekLock: !remove, timeoutIntervalInS: 1 }, (error, message) => {
        if (error) {
          if (error === 'No messages to receive') {
            return deferred.resolve(null);
          }
          return deferred.reject(error);
        }
        deferred.resolve(JSON.parse(message.body));
      });
      result.push(deferred.promise);
    }
    return Q.all(result).then(requests =>
      requests.filter(request => request));
  }

  queueRequests(requests, queue = 'normal') {
    if (!this.serviceBusClient) {
      return Q.reject(new Error('Service bus is not configured.'));
    }
    const queueName = `${this.config.dashboard.serviceBus.queueNamePrefix}-${queue}`;
    return Q.all(requests.map(request => {
      const deferred = Q.defer();
      this.serviceBusClient.sendQueueMessage(queueName, JSON.stringify(request), error => {
        if (error) {
          return deferred.reject(error);
        }
        deferred.resolve();
      });
      return deferred.promise;
    }));
  }

  deleteQueue(name) {
    if (!this.serviceBusClient) {
      return Q.reject(new Error('Service bus is not configured.'));
    }
    const queueName = `${this.config.dashboard.serviceBus.queueNamePrefix}-${name}`;
    const deferred = Q.defer();
    this.serviceBusClient.deleteQueue(queueName, error => {
      if (error) {
        return deferred.reject(error);
      }
      deferred.resolve();
    });
    return deferred.promise;
  }

  createQueue(name) {
    if (!this.serviceBusClient) {
      return Q.reject(new Error('Service bus is not configured.'));
    }
    const queueName = `${this.config.dashboard.serviceBus.queueNamePrefix}-${name}`;
    const options = {
      EnablePartitioning: true,
      LockDuration: 'PT5M',
      DefaultMessageTimeToLive: 'P10675199D',
      MaxDeliveryCount: '100000'
    };
    const deferred = Q.defer();
    this.serviceBusClient.createQueueIfNotExists(queueName, options, (error, created, response) => {
      if (error) {
        return deferred.reject(error);
      }
      deferred.resolve(response.body);
    });
    return deferred.promise;
  }
}

module.exports = ServiceBusClient;
