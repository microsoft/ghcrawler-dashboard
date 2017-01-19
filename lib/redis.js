// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const debug = require('debug')('oss-redis');
const Q = require('q');

function RedisHelper(redisClient, prefix) {
  this.redis = redisClient;
  this.prefix = prefix ? prefix + '.' : '';
}

function objectFromJson(json, callback) {
  var error = null;
  var object = null;
  try {
    if (json) {
      object = JSON.parse(json);
    }
  } catch (ex) {
    error = ex;
    object = null;
  }
  callback(error, object);
}

function objectToJson(object, callback) {
  var error = null;
  var json = null;
  try {
    json = JSON.stringify(object);
  } catch (ex) {
    error = ex;
  }
  callback(error, json);
}

RedisHelper.prototype.getSet = function (key, callback) {
  var k = this.prefix + key;
  this.redis.smembers(k, callback);
};

RedisHelper.prototype.addSetMember = function (key, member, callback) {
  var k = this.prefix + key;
  this.redis.sadd(k, member, callback);
};

RedisHelper.prototype.removeSetMember = function (key, member, callback) {
  var k = this.prefix + key;
  this.redis.srem(k, member, callback);
};

RedisHelper.prototype.get = function (key, callback) {
  var k = this.prefix + key;
  debug('GET ' + k);
  this.redis.get(k, callback);
};

RedisHelper.prototype.set = function (key, value, callback) {
  var k = this.prefix + key;
  debug('SET ' + k);
  this.redis.set(k, value, callback);
};


RedisHelper.prototype.delete = function (key, callback) {
  var k = this.prefix + key;
  debug('DEL ' + k);
  this.redis.del(k, callback);
};

RedisHelper.prototype.setWithExpire = function (key, value, minutesToExpire, callback) {
  if (!minutesToExpire) {
    return callback(new Error('No minutes to expiration provided.'));
  }
  var k = this.prefix + key;
  debug('SET ' + k + ' EX ' + minutesToExpire + 'm');
  this.redis.set(k, value, 'EX', minutesToExpire * 60, callback);
};

RedisHelper.prototype.expire = function (key, minutesToExpire, callback) {
  if (!minutesToExpire) {
    return callback(new Error('No minutes to expiration provided.'));
  }
  var k = this.prefix + key;
  debug('EXP ' + k + ' ' + minutesToExpire + 'm');
  this.redis.expire(k, minutesToExpire * 60, callback);
};

// Helper versions for object/json conversions

RedisHelper.prototype.getObject = function (key, callback) {
  this.get(key, (error, json) => {
    if (error) {
      return callback(error);
    }
    objectFromJson(json, callback);
  });
};

RedisHelper.prototype.setObject = function (key, value, callback) {
  var self = this;
  objectToJson(value, (error, json) => {
    if (!error) {
      self.set(key, json, callback);
    } else {
      callback(error);
    }
  });
};

RedisHelper.prototype.setObjectWithExpire = function (key, value, minutesToExpire, callback) {
  var self = this;
  objectToJson(value, (error, json) => {
    if (!error) {
      self.setWithExpire(key, json, minutesToExpire, callback);
    } else {
      callback(error);
    }
  });
};

RedisHelper.prototype.getAsync = function (key) {
  return Q.ninvoke(this, 'get', key);
};

RedisHelper.prototype.getObjectAsync = function (key) {
  return Q.ninvoke(this, 'getObject', key);
};

RedisHelper.prototype.setAsync = function (key, value) {
  return Q.ninvoke(this, 'set', key, value);
};

RedisHelper.prototype.setObjectAsync = function (key, value) {
  return Q.ninvoke(this, 'setObject', key, value);
};

RedisHelper.prototype.setObjectWithExpireAsync = function (key, value, minutesToExpire) {
  return Q.ninvoke(this, 'setObjectWithExpire', key, value, minutesToExpire);
};

RedisHelper.prototype.setWithExpireAsync = function (key, value, minutesToExpire) {
  return Q.ninvoke(this, 'setWithExpire', key, value, minutesToExpire);
};

RedisHelper.prototype.expireAsync = function (key, minutesToExpire) {
  return Q.ninvoke(this, 'expire', key, minutesToExpire);
};

RedisHelper.prototype.deleteAsync = function (key) {
  return Q.ninvoke(this, 'delete', key);
};

module.exports = RedisHelper;
