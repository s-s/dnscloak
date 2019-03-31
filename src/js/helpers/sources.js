/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var config = require('./../config').shared;
var eventBus = require('./../eventbus');
var ap = require('./../app-prefs');

var _resolverListsStats;

function hasChangesInResolversListStats() {
  return new Promise(function (resolve, reject) {
    if (!_isObject(_resolverListsStats)) _resolverListsStats = {};

    var sources = config.get('sources');

    if (_isObject(sources)) {
      var hasChanges = false;
      var listPromises = [];

      // check for removed sources
      _each(_resolverListsStats, function (v, k) {
        if (!(_isObject(sources[k]) && sources[k].cache_file)) {
          hasChanges = true;
        }
      });

      // check for non-cached sources
      _each(sources, function (v, k) {
        if (!_resolverListsStats[k]) {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        resolve(true);
      } else {
        _each(sources, function (v, k) {
          listPromises.push(new Promise(function (resolveEx) {
            if (v.cache_file) {
              dnstool.fileExists(v.cache_file, function (exists) {
                if (exists) {
                  dnstool.getFileStats(
                    v.cache_file,
                    function (stats) {
                      if (_isObject(_resolverListsStats[k])) {
                        var hasStatsChanges = (
                          stats.createDate != _resolverListsStats[k].createDate ||
                          stats.modifyDate != _resolverListsStats[k].modifyDate ||
                          stats.size != _resolverListsStats[k].size
                        );

                        resolveEx(hasStatsChanges);
                      } else {
                        resolveEx(true);
                      }
                    },
                    function () {
                      resolveEx(false);
                    }
                  );
                } else {
                  resolveEx(false);
                }
              }, function () {
                resolveEx(false);
              });
            } else {
              resolveEx(false);
            }
          }));
        });

        Promise.all(listPromises)
          .then(function (results) {
            resolve(_includes(results, true));
          })
          .catch(reject);
      }
    } else {
      resolve(false);
    }
  });
}

function downloadResolversProxy(lists) {
  return new Promise(function (resolve, reject) {
    dnstool.fetchLists(
      config.get('fallback_resolver') || '9.9.9.9:53',
      config.get('ignore_system_dns') || false,
      lists,
      function () {
        if (ap.DEBUG) console.log('resolvers fetched OK');
        resolve();
      },
      function (err) {
        if (ap.DEBUG) console.log('resolvers fetched fail');
        reject(err);
      }
    );
  });
}

var helpersSources = {
  startPeriodicResolversChangesCheck: function () {
    setInterval(function () {
      helpersSources.doMonitorResolversChanges();
    }, ap.RECHECK_RESOLVERS_INTERVAL);
  },
  doMonitorResolversChanges: function () {
    return hasChangesInResolversListStats()
      .then(function (hasChanges) {
        if (hasChanges) {
          if (ap.DEBUG) console.log('doMonitorResolversChanges found changes -> cache & reload lists');
          return helpersSources.cacheResolversListStats()
            .then(function () {
              eventBus.emit('sources:changed');
            });
        }
      });
  },

  cacheResolversListStats: function () {
    return new Promise(function (resolve, reject) {
      if (!_resolverListsStats) _resolverListsStats = {};

      var sources = config.get('sources');

      if (_isObject(sources)) {
        var listPromises = [];

        _each(_resolverListsStats, function (v, k) {
          if (!(_isObject(sources[k]) && sources[k].cache_file)) {
            delete _resolverListsStats[k];
          }
        });

        _each(sources, function (v, k) {
          listPromises.push(new Promise(function (resolveEx) {
            if (v.cache_file) {
              dnstool.fileExists(v.cache_file, function (exists) {
                if (exists) {
                  dnstool.getFileStats(
                    v.cache_file,
                    function (stats) {
                      _resolverListsStats[k] = stats;
                      resolveEx();
                    },
                    function () {
                      delete _resolverListsStats[k];
                      resolveEx();
                    }
                  );
                } else {
                  delete _resolverListsStats[k];
                  resolveEx();
                }
              }, function () {
                delete _resolverListsStats[k];
                resolveEx();
              });
            } else {
              delete _resolverListsStats[k];
              resolveEx();
            }
          }));
        });

        Promise.all(listPromises)
          .then(resolve)
          .catch(reject);
      } else {
        resolve();
      }
    });
  },

  downloadResolvers: function () {
    return new Promise(function (resolve, reject) {
      var sources = config.get('sources');
      if (_isObject(sources)) {
        var listsToFetch = [];

        _each(sources, function (v) {
          if (v.url && v.cache_file) {
            listsToFetch.push('' + v.url + '|' + v.cache_file);
          }
        });

        if (listsToFetch.length > 0) {
          downloadResolversProxy(listsToFetch)
            .then(resolve)
            .catch(reject);
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  },

  downloadResolversIfNone: function () {
    return new Promise(function (resolve, reject) {
      var sources = config.get('sources');
      if (_isObject(sources)) {
        var listsToFetch = [];
        var listPromises = [];

        _each(sources, function (v) {
          listPromises.push(new Promise(function (resolveEx) {
            if (v.url && v.cache_file) {
              dnstool.fileExists(v.cache_file, function (exists) {
                if (!exists) {
                  listsToFetch.push('' + v.url + '|' + v.cache_file);
                }
                resolveEx();
              }, resolveEx);
            } else {
              resolveEx();
            }
          }));
        });

        Promise.all(listPromises)
          .then(function () {
            if (listsToFetch.length > 0) {
              downloadResolversProxy(listsToFetch)
                .then(resolve)
                .catch(function (e) {
                  reject(e);
                });
            } else {
              resolve();
            }
          })
          .catch(reject);
      } else {
        resolve();
      }
    });
  }
};

module.exports = helpersSources;
