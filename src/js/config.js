/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';
var tomlParse = require('./toml-parse').parse;
var tomlDump = require('./toml-dump').dump;
var utilsFS = require('./utils/fs');


function Config() {
  var config = {};

  this.isDirty = false;

  _extend(this, {
    loadTOML: function (data) {
      config = {};

      _extend(config, tomlParse(data));

      if (!config.server_names) {
        config.server_names = [];
      } else if (!_isArray(config.server_names)) {
        config.server_names = [config.server_names];
      }

      if (_isObject(config.nx_log) && !config.nx_log.file) delete config.nx_log;
      if (_isObject(config.query_log) && !config.query_log.file) delete config.query_log;

      if (!_has(config, 'ipv4_servers')) config.ipv4_servers = true;
      if (!_has(config, 'ipv6_servers')) config.ipv6_servers = true;
      if (!_has(config, 'doh_servers')) config.doh_servers = true;
      if (!_has(config, 'dnscrypt_servers')) config.dnscrypt_servers = true;
      if (!_has(config, 'require_nolog')) config.require_nolog = false;
      if (!_has(config, 'require_nofilter')) config.require_nofilter = false;
      if (!_has(config, 'require_dnssec')) config.require_dnssec = false;

      if (!_has(config, 'log_level')) config.log_level = 2;

      if (!_has(config, 'ios_mode')) config.ios_mode = true;
      if (!_has(config, 'retry_count')) config.retry_count = 5;

      this.markClear();
    },

    markDirty: function () {
      this.isDirty = true;
    },

    markClear: function () {
      this.isDirty = false;
    },

    setProperty: function (key, value) {
      config[key] = value;
      this.markDirty();
      return value;
    },

    removeProperty: function (key) {
      delete config[key];
      this.markDirty();
    },

    getProperty: function (key) {
      return config[key];
    },

    set: function (key, value) {
      return this.setProperty(key, value);
    },

    remove: function (key) {
      return this.removeProperty(key);
    },

    get: function (key) {
      return this.getProperty(key);
    },

    store: function (dirUrl, fileName, dirPath, resolversList) {
      var self = this;
      return new Promise(function (resolve, reject) {
        if (config.server_names) {
          if (_isArray(config.server_names) && config.server_names.length > 0) {
            if (_isArray(resolversList)) {
              var validServs = _map(resolversList, function (el) {
                return el.name;
              });
              config.server_names = _filter(config.server_names, function (el) {
                return _includes(validServs, el);
              });
            }
          }

          if (!_isArray(config.server_names) || config.server_names.length === 0) {
            delete config.server_names;
          }
        }

        if (config.listen_addresses) {
          if (_isArray(config.listen_addresses)) {
            if (!_includes(config.listen_addresses, '127.0.0.1:53')) {
              config.listen_addresses.push('127.0.0.1:53');
            }
            if (!_includes(config.listen_addresses, '[::1]:53')) {
              config.listen_addresses.push('[::1]:53');
            }
          } else {
            if (typeof config.listen_addresses === 'string') {
              if (config.listen_addresses !== '127.0.0.1:53' && config.listen_addresses !== '[::1]:53') {
                config.listen_addresses = [config.listen_addresses];
                config.listen_addresses.push('127.0.0.1:53');
                config.listen_addresses.push('[::1]:53');
              } else {
                config.listen_addresses = ['127.0.0.1:53', '[::1]:53'];
              }
            } else {
              config.listen_addresses = ['127.0.0.1:53', '[::1]:53'];
            }
          }
        } else {
          config.listen_addresses = ['127.0.0.1:53', '[::1]:53'];
        }

        if (_isObject(config.sources)) {
          _each(config.sources, function (v, k) {
            v.cache_file = dirPath + '/dnscrypt/resolvers/' + k + '.md';
          });
        }

        if (config.cloaking_rules) {
          config.cloaking_rules = dirPath + '/dnscrypt/cloaking_rules.txt';
        } else {
          delete config.cloaking_rules;
        }

        if (config.forwarding_rules) {
          config.forwarding_rules = dirPath + '/dnscrypt/forwarding_rules.txt';
        } else {
          delete config.forwarding_rules;
        }

        if (config.log_file) {
          config.log_file = dirPath + '/dnscrypt/logs/dns.log';
        } else {
          delete config.log_file;
        }

        if (config.query_log) {
          if (_isObject(config.query_log)) {
            config.query_log = _extend({
              'file': dirPath + '/dnscrypt/logs/query.log',
              'format': 'tsv'
            }, _omit(config.query_log, 'file'));
          } else {
            config.query_log = {
              'file': dirPath + '/dnscrypt/logs/query.log',
              'format': 'tsv'
            };
          }
        } else {
          delete config.query_log;
        }

        if (config.nx_log) {
          if (_isObject(config.nx_log)) {
            config.nx_log = _extend({
              'file': dirPath + '/dnscrypt/logs/nx.log',
              'format': 'tsv'
            }, _omit(config.nx_log, 'file'));
          } else {
            config.nx_log = {
              'file': dirPath + '/dnscrypt/logs/nx.log',
              'format': 'tsv'
            };
          }
        } else {
          delete config.nx_log;
        }

        if (config.blacklist) {
          if (_isObject(config.blacklist)) {
            config.blacklist = _extend({
              'blacklist_file': dirPath + '/dnscrypt/blacklist.txt',
              'log_file': dirPath + '/dnscrypt/logs/blocked.log',
              'log_format': 'tsv'
            }, _omit(config.blacklist, ['blacklist_file', 'log_file']));

            if (!config.blacklist.log_file) {
              delete config.blacklist.log_file;
            }
          } else {
            config.blacklist = {
              'blacklist_file': dirPath + '/dnscrypt/blacklist.txt',
              'log_file': dirPath + '/dnscrypt/logs/blocked.log',
              'log_format': 'tsv'
            };
          }
        } else {
          delete config.blacklist;
        }

        if (config.whitelist) {
          if (_isObject(config.whitelist)) {
            config.whitelist = _extend({
              'whitelist_file': dirPath + '/dnscrypt/whitelist.txt',
              'log_file': dirPath + '/dnscrypt/logs/whitelist.log',
              'log_format': 'tsv'
            }, _omit(config.whitelist, ['whitelist_file', 'log_file']));
            if (!config.whitelist.log_file) {
              delete config.whitelist.log_file;
            }
          } else {
            config.whitelist = {
              'whitelist_file': dirPath + '/dnscrypt/whitelist.txt',
              'log_file': dirPath + '/dnscrypt/logs/whitelist.log',
              'log_format': 'tsv'
            };
          }
        } else {
          delete config.whitelist;
        }

        if (config.ip_blacklist) {
          if (_isObject(config.ip_blacklist)) {
            config.ip_blacklist = _extend({
              'blacklist_file': dirPath + '/dnscrypt/ip_blacklist.txt',
              'log_file': dirPath + '/dnscrypt/logs/ip_blocked.log',
              'log_format': 'tsv'
            }, _omit(config.ip_blacklist, ['blacklist_file', 'log_file']));
            if (!config.ip_blacklist.log_file) {
              delete config.ip_blacklist.log_file;
            }
          } else {
            config.ip_blacklist = {
              'blacklist_file': dirPath + '/dnscrypt/ip_blacklist.txt',
              'log_file': dirPath + '/dnscrypt/logs/ip_blocked.log',
              'log_format': 'tsv'
            };
          }
        } else {
          delete config.ip_blacklist;
        }

        self.markClear();

        utilsFS.writeDataToFile(
          dirUrl,
          fileName,
          tomlDump(config),
          resolve,
          reject
        );
      });
    }
  });
}

module.exports = {
  Config: Config,
  shared: new Config()
};
