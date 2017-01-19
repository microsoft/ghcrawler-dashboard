// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';
/*eslint no-console: ["error", { allow: ["warn"] }] */

function serialize(config, user, done) {
  done(null, user);
}

function deserialize(config, user, done) {
  done(null, user);
}

function initialize() {
  console.warn('Plain text session tokens are in use. Not recommended for production.');
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
  initialize: initialize,
};
