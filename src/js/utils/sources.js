/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var Resolver = require('./../resolver');
var utilsFS = require('./fs');
var _flatten = require('lodash/flatten');

function parseSourceData(source, data) {
  return new Promise(function (resolve) {
    var prefix = source.prefix;
    if (typeof prefix == 'undefined') prefix = '';

    if (source.format && source.format === 'v1') {
      resolve([]);
    } else {
      var parts = data.split(/## /),
        subparts, name, description, stamp,
        i, len, out,
        outList = [];

      _each(parts, function (part) {
        subparts = part.split(/\s*\n\s*/);

        name = subparts.shift();
        len = subparts.length;
        stamp = '';
        description = '';
        for (i = 0; i < len; i++) {
          if (/^sdns:(\/\/)?/.test(subparts[i])) {
            stamp = subparts[i];
            break;
          } else {
            if (description) description = description + '\n';
            description = description + subparts[i];
          }
        }

        out = new Resolver(name, prefix, stamp, description);
        if (stamp) outList.push(out);
      });
      resolve(outList);
    }
  });
}

module.exports = {
  readResolvers: function (config) {
    return new Promise(function (resolve) {
      var sources = config.get('sources');
      var statics = config.get('static');
      if (_isObject(sources) || _isObject(statics)) {
        var listPromises = [];

        if (_isObject(statics)) {
          listPromises.push(new Promise(function (resolveEx) {
            resolveEx(
              _map(statics, function (v, k) {
                return new Resolver(k.replace(/['"]/g, ''), '', v.stamp, '');
              })
            );
          }));
        }

        if (_isObject(sources)) {
          _each(sources, function (v) {
            listPromises.push(new Promise(function (resolveEx) {
              if (v.cache_file) {
                dnstool.fileExists(v.cache_file, function (exists) {
                  if (exists) {
                    utilsFS.readDataFromFile('file://' + v.cache_file)
                      .then(function (result) {
                        parseSourceData(v, result)
                          .then(resolveEx);
                      })
                      .catch(function () {
                        resolveEx([]);
                      });
                  } else {
                    resolveEx([]);
                  }
                }, function () {
                  resolveEx([]);
                });
              } else {
                resolveEx([]);
              }
            }));
          });
        }

        Promise.all(listPromises)
          .then(function (allData) {
            resolve(_flatten(allData));
          })
          .catch(function () {
            resolve([]);
          });
      } else {
        resolve([]);
      }
    });
  }
};
