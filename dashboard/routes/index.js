// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const CrawlerClient = require('crawler-cli');
const express = require('express');
const expressJoi = require('express-joi');
const MessageRates = require('../business/messageRates');
const path = require('path');
const Q = require('q');
const qlimit = require('qlimit');
const QueueInfoPoller = require('../business/queueInfoPoller');
const url = require('url');
const wrap = require('../../middleware/promiseWrap');

const router = express.Router();

const queueInfoPoller = new QueueInfoPoller();
const messageRates = new MessageRates(queueInfoPoller);

const requestsSchema = {
  queue: expressJoi.Joi.types.String().alphanum().min(2).max(50).required(),
  count: expressJoi.Joi.types.Number().integer().min(0).max(100)
};
const queueSchema = {
  name: expressJoi.Joi.types.String().alphanum().min(2).max(50).required()
};

const deadlettersSchema = {
  action: expressJoi.Joi.types.String().valid(['delete', 'requeue']).required(),
  queue: expressJoi.Joi.types.String().alphanum().min(2).max(50),
  urns: expressJoi.Joi.array().min(1)
};

let config = null;
let crawlerClient = null;

router.init = (app, callback) => {
  config = app.get('runtimeConfig');
  const crawlerUrl = config.dashboard.crawler.url;
  const crawlerToken = config.dashboard.crawler.apiToken;
  crawlerClient = new CrawlerClient(crawlerUrl, crawlerToken);

  queueInfoPoller.initialize(config);
  queueInfoPoller.startCollectingData();
  const redisClient = app.get('providers').redisClient;
  messageRates.initialize(config, redisClient);
  callback();
};

router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

router.get('/config', wrap(function* (request, response) {
  request.insights.trackEvent('crawlerConfigGetStart');
  const config = yield crawlerClient.getConfiguration();
  config.crawler.url = crawlerClient.url;
  queueInfoPoller.crawlerName = config.crawler.name;
  response.json(config);
  request.insights.trackEvent('crawlerConfigGetComplete');
}));

router.patch('/config', wrap(function* (request, response) {
  request.insights.trackEvent('crawlerConfigPatchStart');
  yield crawlerClient.configureCrawler(request.body);
  response.json({ success: true });
  request.insights.trackEvent('crawlerConfigPatchComplete');
}));

router.get('/deadletters', wrap(function* (request, response) {
  request.insights.trackEvent('dashboardListDeadlettersStart');
  let deadletters = yield crawlerClient.listDeadletters();
  deadletters = deadletters.map(letter => {
    // Azure blob metadata keys are forced to lowercase so do this consistently for all stores
    Object.keys(letter).forEach(key => {
      if (key !== key.toLowerCase()) {
        letter[key.toLowerCase()] = letter[key];
        delete letter[key];
      }
    });

    // Azure blob metadata has a top level urn but other stores don't
    if (!letter.urn && letter.links && letter.links.self) {
      letter.urn = letter.links.self.href;
    }

    return {
      type: letter.extra.type,
      path: url.parse(letter.extra.url).pathname,
      reason: letter.extra.reason,
      date: letter.processedat.substr(2, 17),
      urn: letter.urn
    };
  });
  response.json(deadletters);
  request.insights.trackEvent('dashboardListDeadlettersComplete');
}));

router.get('/deadletters/:urn', wrap(function* (request, response) {
  request.insights.trackEvent('dashboardGetDeadletterStart');
  const deadletters = yield crawlerClient.getDeadletter(request.params.urn);
  response.json(deadletters);
  request.insights.trackEvent('dashboardGetDeadletterComplete');
}));

router.post('/deadletters', expressJoi.joiValidate(deadlettersSchema), wrap(function* (request, response) {
  request.insights.trackEvent('dashboardPostDeadletterStart');
  const action = request.query.action;
  const requeueQueueName = request.query.queue || 'soon';
  const urns = request.body.urns;
  const results = yield Q.allSettled(urns.map(qlimit(10)(urn => {
    if (action === 'requeue') {
      return crawlerClient.requeueDeadletter(urn, requeueQueueName);
    }
    return crawlerClient.deleteDeadletter(urn);
  })));
  const errors = [];
  results.forEach(result => {
    if (result.state === 'rejected') {
      errors.push(result.reason.message);
    }
  });
  const respMessage = { success: true };
  if (errors.length > 0) {
    respMessage.warnings = errors;
  }
  response.json(respMessage);
  request.insights.trackEvent('dashboardPostDeadletterComplete');
}));

router.get('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function* (request, response) {
  request.insights.trackEvent('dashboardGetRequestsStart');
  const requests = yield crawlerClient.getRequests(request.params.queue, parseInt(request.query.count, 10));
  response.json(requests);
  request.insights.trackEvent('dashboardGetRequestsComplete');
}));

router.delete('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function* (request, response) {
  request.insights.trackEvent('dashboardDeleteRequestsStart');
  const requests = yield crawlerClient.deleteRequests(request.params.queue, parseInt(request.query.count, 10));
  response.json(requests);
  request.insights.trackEvent('dashboardDeleteRequestsComplete');
}));

router.post('/requests/:queue', wrap(function* (request, response) {
  request.insights.trackEvent('dashboardQueueRequestStart');
  yield crawlerClient.queueRequests(request.body, request.params.queue || 'normal');
  response.sendStatus(201);
  request.insights.trackEvent('dashboardQueueRequestComplete');
}));

router.put('/queue/:name', expressJoi.joiValidate(queueSchema), wrap(function* (request, response) {
  request.insights.trackEvent('dashboardFlushQueueStart');
  yield crawlerClient.flushQueue(request.params.name);
  response.sendStatus(200);
  request.insights.trackEvent('dashboardFlushQueueComplete');
}));

router.get('/queuesData', (request, response) => {
  request.insights.trackEvent('queuesDataGetStart');
  response.json(queueInfoPoller.getQueuesActiveMessageCountsData(request.query.sec));
  request.insights.trackEvent('queuesDataGetComplete');
});

router.get('/messageRatesData', (request, response) => {
  request.insights.trackEvent('messageRatesDataStart');
  return messageRates.getMessageRatesData(request.query.sec).then(stats => {
    request.insights.trackEvent('messageRatesDataComplete');
    return response.json(stats);
  }).catch(() => {
    return response.status(500).end();
  });
});


module.exports = router;
