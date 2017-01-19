// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';
const utils = require('../utils');

module.exports.corporateRoute = function corporateRoute(req, res, next) {
  if (!req.app.settings.runtimeConfig.activeDirectory.clientId || req.isAuthenticated()) {
    return next();
  }
  utils.storeOriginalUrlAsReferrer(req, res, '/auth/azure');
};

module.exports.corporateRender = function corporateRender(req, res, view, title, optionalObject, site) {
  if (typeof title == 'object') {
    optionalObject = title;
    title = '';
  }
  const breadcrumbs = req.breadcrumbs;
  if (breadcrumbs && breadcrumbs.length && breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].isLast = true;
  }
  const authScheme = 'aad';
  const user = {
    primaryAuthenticationScheme: authScheme,
    primaryUsername: req.user && req.user.azure && req.user.azure.displayName ? req.user.azure.displayName : undefined,
    githubSignout: '/signout/github',
    azureSignout: '/signout',
  };
  if (req.user && req.user.azure && req.user.azure.username) {
    user.azure = {
      username: req.user.azure.username,
      displayName: req.user.azure.displayName,
    };
  }

  const obj = {
    title: title,
    config: req.app.settings.runtimeConfig,
    user: user,
    ossLink: null, // this.entities.link,
    showBreadcrumbs: false,
    breadcrumbs: breadcrumbs,
    sudoMode: req.sudoMode,
    view: view,
    site: site || 'explore',
  };
  if (optionalObject) {
    utils.merge(obj, optionalObject);
  }
  if (req.session && req.session.alerts && req.session.alerts.length && req.session.alerts.length > 0) {
    const alerts = [];
    utils.merge(alerts, req.session.alerts);
    req.session.alerts = [];
    for (let i = 0; i < alerts.length; i++) {
      if (typeof alerts[i] == 'object') {
        alerts[i].number = i + 1;
      }
    }
    obj.alerts = alerts;
  }
  res.render(view, obj);

};