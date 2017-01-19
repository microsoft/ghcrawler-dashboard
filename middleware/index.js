// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/*eslint no-console: ["error", { allow: ["warn"] }] */

const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');

module.exports = function initMiddleware(app, express, config, dirname, redisClient, initializationError) {
  if (!initializationError) {
    if (config.webServer.allowHttp) {
      console.warn('WARNING: Allowing HTTP for local debugging');
    } else {
      app.use(require('./sslify'));
      app.use(require('./hsts'));
    }
    app.use(require('./correlationId'));
    require('./appInsights')(app, config);
  }

  app.set('views', path.join(dirname, 'views'));
  app.set('view engine', 'pug');
  app.set('view cache', false);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(compression());

  var passport;
  if (!initializationError) {
    if (config.webServer.websiteSku && !config.webServer.allowHttp) {
      app.use(require('./requireSecureAppService'));
    }
    app.use(require('./session')(app, config, redisClient));
    try {
      if (config.activeDirectory.clientId) {
        passport = require('./passport-config')(app, config);
      }
    } catch (passportError) {
      initializationError = passportError;
    }
  }

  app.use(require('./scrubbedUrl'));
  app.use(require('./logger')(config));

  if (!initializationError && config.activeDirectory.clientId) {
    require('./passport-routes')(app, passport, config);
  }

  if (initializationError) {
    throw initializationError;
  }
};
