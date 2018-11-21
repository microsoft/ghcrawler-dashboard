// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const async = require('async');
const appInsights = require('./appInsights');
const debug = require('debug')('oss-initialize');
const redis = require('redis');
const RedisHelper = require('../lib/redis');

// Asynchronous initialization for the Express app, configuration and data stores.
module.exports = function init(app, express, rootdir, config, configurationError, callback) {
  let redisClient;
  app.set('runtimeConfig', config);
  let providers = {};
  app.set('providers', providers);
  providers.insights = appInsights(app, config);
  const finalizeInitialization = (error) => {
    providers.redisClient = redisClient;
    try {
      require('./')(app, express, config, rootdir, redisClient, error);
    } catch (middlewareError) {
      error = middlewareError;
    }
    if (!error) {
      app.use('/', require('../dashboard/'));
    } else {
      debug('App crashed because of an initialization error.');
      debug(error);
      const appInsightsClient = providers.insights;
      const crash = () => {
        return () => {
          process.exit(1);
        };
      };
      if (appInsightsClient) {
        appInsightsClient.trackException({
          exception: error,
          properties: { info: 'App crashed because of an initialization error.' }
        });
        appInsightsClient.sendPendingData(crash(error));
      } else {
        crash(error)();
      }
    }
    require('./error-routes')(app, error);
    callback(null, app);
  };
  if (configurationError) {
    return finalizeInitialization(configurationError);
  }
  providers.config = config;
  debug('configuration secrets resolved');
  let redisFirstCallback;
  let redisOptions = {
  };
  if (config.redis.key) {
    redisOptions.auth_pass = config.redis.key;
  }
  if (config.redis.tls) {
    redisOptions.tls = {
      servername: config.redis.servername,
    };
  }
  debug(`connecting to Redis ${config.redis.host}`);
  const port = config.redis.port || (config.redis.tls ? 6380 : 6379);
  redisClient = redis.createClient(port, config.redis.host || config.redis.tls, redisOptions);
  const redisHelper = new RedisHelper(redisClient, config.redis.prefix);
  app.set('redisHelper', redisHelper);
  providers.redis = redisHelper;
  redisClient.on('connect', () => {
    providers.insights.trackTrace({ message: 'CrawlerDashboardRedisConnect' });
    if (redisFirstCallback) {
      const cb = redisFirstCallback;
      redisFirstCallback = null;
      cb();
    }
  });
  redisClient.on('error', error => {
    providers.insights.trackException({ exception: error, properties: { name: 'CrawlerDashboardRedisError' } });
  });
  redisClient.on('reconnecting', properties => {
    providers.insights.trackEvent({ name: 'CrawlerDashboardRedisReconnecting', properties });
  });
  redisClient.on('end', () => {
    providers.insights.trackTrace({ message: 'CrawlerDashboardRedisEnd' });
  });
  async.parallel([
    cb => {
      redisFirstCallback = cb;
      if (config.redis.key) {
        redisClient.auth(config.redis.key);
      }
      debug('authenticated to Redis');
    }
  ], error => {
    finalizeInitialization(error);
  });
};
