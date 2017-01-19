// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const Amqp10Queue = require('./amqp10Queue');
const Q = require('q');

class AmqpClient {
  constructor(config, queueName, insights) {
    this.config = config;
    this.queueName = queueName;
    this.insights = insights;
    this.queue = null;
    this.logger = {
      info: message => insights.trackEvent(message),
      silly: message => insights.trackEvent(message),
      error: (error, message) => insights.trackException(error, message)
    };
  }

  connect(count) {
    if (this.queue) {
      return Q();
    }
    const formatter = message => {
      return message;
    };
    this.queue = new Amqp10Queue(this.config.dashboard.amqp.connectionString, this.queueName, formatter,
      { credit: count, queueName: this.config.dashboard.serviceBus.queueNamePrefix, logger: this.logger, _config: { on: () => { } } });
    // delay long enough for the queue to get primed up with the messages of interest
    return this.queue.subscribe().delay(2000);
  }

  disconnect() {
    if (!this.queue) {
      return Q();
    }
    return this.queue.unsubscribe().finally(() => this.queue = null);
  }

  getRequests(count, remove = false) {
    return Q
      .try(this.connect.bind(this, count))
      .then(this._getRequests.bind(this, count))
      .then(this._finishRequests.bind(this, remove))
      .finally(this.disconnect.bind(this))
      .then(() => this.result);
  }

  _getRequests(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(this.queue.pop());
    }
    return Q.all(result).then(requests =>
      requests.filter(request => request));
  }

  _finishRequests(remove, requests) {
    this.result = requests;
    return Q.all(requests.map(request => remove ? this.queue.done(request) : this.queue.abandon(request)));
  }
}

module.exports = AmqpClient;