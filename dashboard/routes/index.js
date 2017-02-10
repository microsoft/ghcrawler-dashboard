// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const AmqpClient = require('../business/amqpClient');
const express = require('express');
const expressJoi = require('express-joi');
const MessageRates = require('../business/messageRates');
const OptionsService = require('../business/optionsService');
const path = require('path');
const ServiceBusClient = require('../business/sbClient');
const ServiceBusStatsPoller = require('../business/sbStatsPoller');
const wrap = require('../../middleware/promiseWrap');

const router = express.Router();

const configService = new OptionsService();
const serviceBusClient = new ServiceBusClient();
const serviceBusStatsPoller = new ServiceBusStatsPoller();
const messageRates = new MessageRates();

const requestsSchema = {
  queue: expressJoi.Joi.types.String().alphanum().min(2).max(50).required(),
  count: expressJoi.Joi.types.Number().integer().min(0).max(100)
};
const queueSchema = {
  name: expressJoi.Joi.types.String().alphanum().min(2).max(50).required()
};

let config = null;

router.init = (app, callback) => {
  config = app.get('runtimeConfig');
  const providers = app.get('providers');
  let options = null;
  if (config.dashboard && config.dashboard.configProvider && config.dashboard.configProvider.toLowerCase() === 'inmemory') {
    options = OptionsService.createInMemoryOptions(config.crawlerDefaults);
  } else {
    const crawlerName = config.crawlerDefaults.crawler.name;
    options = OptionsService.createRedisOptions(config.crawlerDefaults, crawlerName, providers.redisClient);
  }
  serviceBusClient.initialize(config, providers.serviceBusClient);
  serviceBusStatsPoller.initialize(config, providers.serviceBusClient);
  serviceBusStatsPoller.startCollectingData();
  messageRates.initialize(config);
  configService.initialize(options).then(callback, callback);
};

router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

router.get('/config', wrap(function* (request, response) {
  request.insights.trackEvent('crawlerConfigGetStart');
  const config = yield configService.getAll().then(result => {
    result = Object.assign({}, result);
    Object.getOwnPropertyNames(result).forEach(key => {
      result[key] = Object.assign({}, result[key]);
      delete result[key]._config;
      delete result[key].logger;
    });
    return result;
  });

  response.json(config);
  request.insights.trackEvent('crawlerConfigGetComplete');
}));

router.patch('/config', wrap(function*(request, response) {
  request.insights.trackEvent('crawlerConfigPatchStart');
  yield configService.apply(request.body);
  response.json({ sucess: true });
  request.insights.trackEvent('crawlerConfigPatchComplete');
}));

router.get('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function*(request, response) {
  request.insights.trackEvent('dashboardGetRequestsStart');
  const queueClient = new AmqpClient(config, request.params.queue, request.insights);
  const requests = yield queueClient.getRequests(request.query.count, false);
  response.json(requests);
  request.insights.trackEvent('dashboardGetRequestsComplete');
}));

router.delete('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function*(request, response) {
  request.insights.trackEvent('dashboardDeleteRequestsStart');
  const queueClient = new AmqpClient(config, request.params.queue, request.insights);
  const requests = yield queueClient.getRequests(request.query.count, true);
  response.json(requests);
  request.insights.trackEvent('dashboardDeleteRequestsComplete');
}));

router.post('/requests/:queue', wrap(function*(request, response) {
  request.insights.trackEvent('dashboardQueueRequestStart');
  const body = request.body;
  const queue = request.params.queue || 'normal';
  yield serviceBusClient.queueRequests(Array.isArray(body) ? body : [body], queue);
  response.sendStatus(201);
  request.insights.trackEvent('dashboardQueueRequestComplete');
}));

router.post('/queue/:name', expressJoi.joiValidate(queueSchema), wrap(function*(request, response) {
  request.insights.trackEvent('dashboardRecreateQueueStart');
  yield serviceBusClient.deleteQueue(request.params.name);
  const queue = yield serviceBusClient.createQueue(request.params.name);
  response.json(queue);
  request.insights.trackEvent('dashboardRecreateQueueComplete');
}));

router.get('/queuesData', (request, response) => {
  request.insights.trackEvent('queuesDataGetStart');
  response.json(serviceBusStatsPoller.getQueuesActiveMessageCountsData(request.query.sec));
  request.insights.trackEvent('queuesDataGetComplete');
});

router.get('/messageRatesData', (request, response) => {
  request.insights.trackEvent('messageRatesDataStart');
  return messageRates.getMessageRatesData(request.query.sec).then(stats => {
    request.insights.trackEvent('messageRatesDataComplete');
    return response.json(stats);
  });
});


module.exports = router;
