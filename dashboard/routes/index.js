// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const CrawlerClient = require('crawler-cli');
const express = require('express');
const expressJoi = require('express-joi');
const MessageRates = require('../business/messageRates');
const path = require('path');
const ServiceBusStatsPoller = require('../business/sbStatsPoller');
const wrap = require('../../middleware/promiseWrap');

const router = express.Router();

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
let crawlerClient = null;

router.init = (app, callback) => {
  const providers = app.get('providers');
  config = app.get('runtimeConfig');
  const crawlerUrl = config.dashboard.crawler.url;
  const crawlerToken = config.dashboard.crawler.apiToken;
  crawlerClient = new CrawlerClient(crawlerUrl, crawlerToken);

  serviceBusStatsPoller.initialize(config, providers.serviceBusClient);
  serviceBusStatsPoller.startCollectingData();
  messageRates.initialize(config);
  callback();
};

router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

router.get('/config', wrap(function* (request, response) {
  request.insights.trackEvent('crawlerConfigGetStart');
  const config = yield crawlerClient.getConfiguration();
  response.json(config);
  request.insights.trackEvent('crawlerConfigGetComplete');
}));

router.patch('/config', wrap(function*(request, response) {
  request.insights.trackEvent('crawlerConfigPatchStart');
  yield crawlerClient.patchConfiguration(request.body);
  response.json({ success: true });
  request.insights.trackEvent('crawlerConfigPatchComplete');
}));

router.get('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function*(request, response) {
  request.insights.trackEvent('dashboardGetRequestsStart');
  const requests = yield crawlerClient.getRequests(request.params.queue, request.query.count);
  response.json(requests);
  request.insights.trackEvent('dashboardGetRequestsComplete');
}));

router.delete('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function*(request, response) {
  request.insights.trackEvent('dashboardDeleteRequestsStart');
  const requests = yield crawlerClient.deleteRequests(request.params.queue, request.query.count);
  response.json(requests);
  request.insights.trackEvent('dashboardDeleteRequestsComplete');
}));

router.post('/requests/:queue', wrap(function*(request, response) {
  request.insights.trackEvent('dashboardQueueRequestStart');
  yield crawlerClient.queueRequests(request.body, request.params.queue || 'normal');
  response.sendStatus(201);
  request.insights.trackEvent('dashboardQueueRequestComplete');
}));

router.put('/queue/:name', expressJoi.joiValidate(queueSchema), wrap(function*(request, response) {
  request.insights.trackEvent('dashboardFlushQueueStart');
  yield crawlerClient.flushQueue(request.params.queue);
  response.sendStatus(200);
  request.insights.trackEvent('dashboardFlushQueueComplete');
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
