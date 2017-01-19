// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const utils = require('../utils');

module.exports = function configurePassport(app, passport, initialConfig) {
  app.get('/signin', (req, res) => {
    utils.storeReferrer(req, res, '/auth/azure');
  });

  var aadMiddleware = passport.authenticate('azure-active-directory');

  app.get('/auth/azure', aadMiddleware);

  app.post('/auth/azure/callback', aadMiddleware, (req, res) => utils.redirectToReferrer(req, res));

  app.get('/signin/azure', (req, res) => {
    utils.storeReferrer(req, res, '/auth/azure');
  });

  function signout(req, res) {
    req.logout();
    res.render('message', {
      message: 'Goodbye',
      title: 'Goodbye',
      buttonText: 'Sign in',
      buttonLink: '/signin',
      config: initialConfig.obfuscatedConfig,
    });
  }

  app.get('/signout', signout);

  app.get('/signout/azure', signout);

};
