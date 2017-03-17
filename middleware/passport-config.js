// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const passport = require('passport');
const serializer = require('./passport/serializer');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

function activeDirectorySubset(iss, sub, profile, done) {
  // CONSIDER: TODO: Hybrid tenant checks.
  // Internal-only code:
  // ----------------------------------------------------------------
  // We've identified users with e-mail addresses in AAD similar to
  // myoutlookaddress#live.com. These are where people have had work
  // shared with them through a service like Office 365; these users
  // are not technically employees with active credentials, and so
  // they should *not* have access. We reject here before the
  // session tokens can be saved.
  // if (username && username.indexOf && username.indexOf('#') >= 0) {
  //   return next(new Error('Your hybrid tenant account, ' + username + ', is not permitted for this resource. Were you invited as an outside collaborator by accident? Please contact us if you have any questions.'));
  // }
  let subset = {
    azure: {
      displayName: profile.displayName,
      oid: profile.oid,
      username: profile.upn,
    },
  };
  done(null, subset);
}

module.exports = function (app, config) {
  let aadStrategy = new OIDCStrategy({
    redirectUrl: config.activeDirectory.redirectUrl,
    allowHttpForRedirectUrl: config.webServer.allowHttp,
    realm: config.activeDirectory.tenantId,
    clientID: config.activeDirectory.clientId,
    clientSecret: config.activeDirectory.clientSecret,
    oidcIssuer: config.activeDirectory.issuer,
    identityMetadata: 'https://login.microsoftonline.com/' + config.activeDirectory.tenantId + '/.well-known/openid-configuration',
    responseType: 'id_token code',
    responseMode: 'form_post',
    validateIssuer: true,
    loggingLevel: 'info'
  }, activeDirectorySubset);

  passport.use('azure-active-directory', aadStrategy);

  app.use(passport.initialize());
  app.use(passport.session());

  const serializerOptions = {
    config: config,
    keyResolver: app.get('keyEncryptionKeyResolver'),
  };

  passport.serializeUser(serializer.serialize(serializerOptions));
  passport.deserializeUser(serializer.deserialize(serializerOptions));
  serializer.initialize(serializerOptions, app);

  return passport;
};
