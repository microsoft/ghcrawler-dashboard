// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

const CrawlerClient = require('ghcrawler-cli');
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

  const insights = app.get('providers').insights;
  queueInfoPoller.initialize(config, insights);
  queueInfoPoller.startCollectingData();
  const redisClient = app.get('providers').redisClient;
  messageRates.initialize(config, redisClient);
  callback();
};

router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

router.get('/config', wrap(function* (request, response) {
  const config = yield crawlerClient.getConfiguration();
  config.crawler.url = crawlerClient.url;
  queueInfoPoller.crawlerName = config.crawler.name;
  response.json(config);
}));

router.patch('/config', wrap(function* (request, response) {
  request.insights.trackTrace({ message: 'CrawlerConfigPatch' });
  yield crawlerClient.configureCrawler(request.body);
  response.json({ success: true });
}));

router.get('/deadletters', wrap(function* (request, response) {
  let deadletters = yield crawlerClient.listDeadletters();
  deadletters = deadletters.map(letter => {
    return {
      type: letter.extra.type,
      path: url.parse(letter.extra.url).pathname,
      reason: letter.extra.reason,
      date: letter.processedAt.substr(2, 17),
      urn: letter.urn
    };
  });
  response.json(deadletters);
}));

router.get('/deadletters/:urn', wrap(function* (request, response) {
  const deadletters = yield crawlerClient.getDeadletter(request.params.urn);
  response.json(deadletters);
}));

router.post('/deadletters', expressJoi.joiValidate(deadlettersSchema), wrap(function* (request, response) {
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
}));

router.get('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function* (request, response) {
  const requests = yield crawlerClient.getRequests(request.params.queue, parseInt(request.query.count, 10));
  response.json(requests);
}));

router.delete('/requests/:queue', expressJoi.joiValidate(requestsSchema), wrap(function* (request, response) {
  const requests = yield crawlerClient.deleteRequests(request.params.queue, parseInt(request.query.count, 10));
  response.json(requests);
}));

router.post('/requests/:queue', wrap(function* (request, response) {
  yield crawlerClient.queueRequests(request.body, request.params.queue || 'normal');
  response.sendStatus(201);
}));

router.put('/queue/:name', expressJoi.joiValidate(queueSchema), wrap(function* (request, response) {
  yield crawlerClient.flushQueue(request.params.name);
  response.sendStatus(200);
}));

router.get('/queuesData', (request, response) => {
  response.json(queueInfoPoller.getQueuesActiveMessageCountsData(request.query.sec));
});

router.get('/messageRatesData', (request, response) => {
  return messageRates.getMessageRatesData(request.query.sec).then(stats => {
    return response.json(stats);
  }).catch(() => {
    return response.status(500).end();
  });
});


module.exports = router;
