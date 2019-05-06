// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// ----------------------------------------------------------------------------
// Session utility: Store the referral URL, if present, and redirect to a new
// location.
// ----------------------------------------------------------------------------
exports.storeReferrer = function storeReferrer(req, res, redirect) {
  if (req.session && req.headers && req.headers.referer && req.session.referer !== undefined && !req.headers.referer.includes('/signout')) {
    req.session.referer = req.headers.referer;
  }
  if (redirect) {
    res.redirect(redirect);
  }
};

// ----------------------------------------------------------------------------
// Session utility: store the original URL
// ----------------------------------------------------------------------------
exports.storeOriginalUrlAsReferrer = function storeOriginalUrl(req, res, redirect) {
  storeOriginalUrlAsVariable(req, res, 'referer', redirect);
};

exports.redirectToReferrer = function redirectToReferrer(req, res, url) {
  url = url || '/';
  const alternateUrl = popSessionVariable(req, res, 'referer');
  res.redirect(alternateUrl || url);
};

function storeOriginalUrlAsVariable(req, res, variable, redirect) {
  if (req.session && req.originalUrl) {
    req.session[variable] = req.originalUrl;
  }
  if (redirect) {
    res.redirect(redirect);
  }
}

exports.storeOriginalUrlAsVariable = storeOriginalUrlAsVariable;

function popSessionVariable(req, res, variableName) {
  if (req.session && req.session[variableName] !== undefined) {
    const url = req.session[variableName];
    delete req.session[variableName];
    return url;
  }
}

exports.popSessionVariable = popSessionVariable;

// ----------------------------------------------------------------------------
// Provide our own error wrapper and message for an underlying thrown error.
// Useful for the user-presentable version.
// ----------------------------------------------------------------------------
exports.wrapError = function (error, message, userIntendedMessage) {
  var err = new Error(message);
  err.innerError = error;
  if (error && error.stack) {
    err.stack = error.stack;
  }
  if (userIntendedMessage === true) {
    err.skipLog = true;
  }
  return err;
};

// ----------------------------------------------------------------------------
// Split and set an optional array, or empty array, trimming each.
// ----------------------------------------------------------------------------
exports.arrayFromString = function (a, split) {
  if (!split) {
    split = ',';
  }
  if (a && Array.isArray(a)) {
    return a;
  }
  var b = a && a.split ? a.split(split) : [];
  if (b && b.length) {
    for (var i = 0; i < b.length; i++) {
      b[i] = b[i].trim();
    }
  }
  return b;
};

// ----------------------------------------------------------------------------
// Simplistic merge of setting properties from b on object a.
// ----------------------------------------------------------------------------
exports.merge = function (a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};


// ----------------------------------------------------------------------------
// Improved "Is Array" check.
// ----------------------------------------------------------------------------
exports.isArray = function (value) {
  return value && typeof value === 'object' && value.constructor === Array;
};

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Obfuscate a string value, optionally leaving a few characters visible.
// ----------------------------------------------------------------------------
exports.obfuscate = function obfuscate(value, lastCharactersShowCount) {
  if (value === undefined || value === null || value.length === undefined) {
    return value;
  }
  var length = value.length;
  lastCharactersShowCount = lastCharactersShowCount || 0;
  lastCharactersShowCount = Math.min(Math.round(lastCharactersShowCount), length - 1);
  var obfuscated = '';
  for (var i = 0; i < length - lastCharactersShowCount; i++) {
    obfuscated += '*';
  }
  for (var j = length - lastCharactersShowCount; j < length; j++) {
    obfuscated += value[j];
  }
  return obfuscated;
};
