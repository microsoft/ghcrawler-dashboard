// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

const logger = require('morgan');

const encryptionMetadataKey = '_ClientEncryptionMetadata2';
// const piiFormat = ':id :method :scrubbedUrl :status :response-time ms - :res[content-length] :encryptedSession :correlationId';
const format = ':method :scrubbedUrl :status :response-time ms - :res[content-length] :encryptedSession :correlationId';

logger.token('encryptedSession', function getUserId(req) {
  if (req.session && req.session.passport && req.session.passport.user) {
    const userType = 'azure';
    return req.session.passport.user[userType] && req.session.passport.user[userType][encryptionMetadataKey] !== undefined ? 'encrypted' : 'plain';
  }
});

logger.token('id', function getUserId(req) {
  const config = req.app.settings.runtimeConfig;
  if (config) {
    const userType = 'azure';
    return req.user && req.user[userType] && req.user[userType].username ? req.user[userType].username : undefined;
  }
});

logger.token('correlationId', function getCorrelationId(req) {
  return req.correlationId;
});

logger.token('scrubbedUrl', function getScrubbedUrl(req) {
  return req.scrubbedUrl || req.originalUrl || req.url;
});

module.exports = function createLogger(/* config */) {
  return logger(format);
};
