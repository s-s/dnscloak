/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';
var tomlDump = require('./../toml-dump').dump;
var config = require('./../config').shared;
var eventBus = require('./../eventbus');
var helpersDNSSettings = require('./dnssettings');
var prefsStore = require('./../prefs');
var resolversList = require('./../resolverslist');
var utilsConfig = require('./../utils/config');
var utilsFS = require('./../utils/fs');
var ap = require('./../app-prefs');

var HelpersConfig = {
  writeDefaultConfigIfNone: function () {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        var pathToFile = sc.url + 'dnscrypt/dnscrypt.toml';
        function doWrite () {
          var defaultConfig = {
            'server_names': [],
            'listen_addresses': [
              '127.0.0.1:53',
              '[::1]:53'
            ],
            'ipv4_servers': true,
            'ipv6_servers': true,

            'max_clients': 250,

            'dnscrypt_servers': true,
            'doh_servers': true,

            'require_dnssec': false,
            'require_nolog': false,
            'require_nofilter': false,
            'force_tcp': false,
            'timeout': 2500,
            'cert_refresh_delay': 240,
            'block_ipv6': false,
            'cache': true,
            'cache_size': 256,
            'cache_min_ttl': 600,
            'cache_max_ttl': 86400,
            'cache_neg_ttl': 60,

            'tls_disable_session_tickets': false,
            'dnscrypt_ephemeral_keys': false,

            'fallback_resolver': '9.9.9.9:53',
            'ignore_system_dns': false,

            'log_files_max_size': 10,
            'log_files_max_age': 7,
            'log_files_max_backups': 1,
            'max_workers': 25,
            'netprobe_timeout': 0,

            'query_log': {},
            'nx_log': {
              'format': 'tsv'
            },
            'blacklist': {},

            'whitelist': {},
            'ip_blacklist': {},
            'sources': {
              '\'public-resolvers\'': {
                'url': ap.DEFAULT_RESOLVERS_URL,
                'minisign_key': 'RWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3',
                'cache_file': sc.path + '/dnscrypt/resolvers/public-resolvers.md',
                'format': 'v2',
                'refresh_delay': 72,
                'prefix': ''
              }
            }
          };
          var data = tomlDump(defaultConfig);

          utilsFS.writeDataToFile(
            sc.url + 'dnscrypt',
            'dnscrypt.toml',
            data,
            resolve,
            reject
          );
        }

        window.resolveLocalFileSystemURL(pathToFile, function (fe) {
          fe.file(function (f) {
            if (f.size > 0) {
              resolve();
            } else {
              doWrite();
            }
          }, reject);
        }, doWrite);
      }, reject);
    });
  },

  writeDefaultUserConfig: function () {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        var defaultConfig = '# This is the default DNSCloak config file\n' +
          '# You may override or add any dnscrypt-proxy option\n' +
          '# Custom lists & static servers are supported ;)\n' +
          '# \n' +
          '# PLEASE READ CAREFULLY:\n' +
          '# \n' +
          '# LISTEN_ADDRESSES: DNSCloak will force include "127.0.0.1:53" and "[::1]:53"\n' +
          '# \n' +
          '# SOURCES: do not specify cache_file - DNSCloak will set this property using source name ([sources.foobar] -> foobar.md)\n' +
          '# \n' +
          '# ALL LOGS: use UI or specify anything - DNSCloak will override these properties with propper files\n' +
          '# \n' +
          '# ALL BLACKLISTS, CLOAKING, FORWARDING RULES: use UI to pick rules files or to toggle these features\n' +
          '\n\n' +
          'listen_addresses = [ "127.0.0.1:53", "[::1]:53" ]\n' +
          'ipv4_servers = true\n' +
          'ipv6_servers = true\n' +
          'max_clients = 250\n' +
          'dnscrypt_servers = true\n' +
          'doh_servers = true\n' +
          'require_dnssec = false\n' +
          'require_nolog = false\n' +
          'require_nofilter = false\n' +
          'force_tcp = false\n' +
          'tls_disable_session_tickets = false\n' +
          'dnscrypt_ephemeral_keys = false\n' +
          'timeout = 2500\n' +
          'cert_refresh_delay = 240\n' +
          'block_ipv6 = false\n' +
          'cache = true\n' +
          'cache_size = 256\n' +
          'cache_min_ttl = 600\n' +
          'cache_max_ttl = 86400\n' +
          'cache_neg_ttl = 60\n' +
          'fallback_resolver = "9.9.9.9:53"\n' +
          'ignore_system_dns = false\n' +
          'log_files_max_size = 10\n' +
          'log_files_max_age = 7\n' +
          'log_files_max_backups = 1\n' +
          'netprobe_timeout = 0\n' +
          '[sources.public-resolvers]\n' +
          'url = "https://raw.githubusercontent.com/DNSCrypt/dnscrypt-resolvers/master/v2/public-resolvers.md"\n' +
          'minisign_key = "RWQf6LRCGA9i53mlYecO4IzT51TGPpvWucNSCh1CBM0QTaLn73Y7GFO3"\n' +
          'format = "v2"\n' +
          'refresh_delay = 72\n' +
          'prefix = ""\n';

        utilsFS.writeDataToFile(
          sc.url + 'dnscrypt',
          'dnscrypt-user.toml',
          defaultConfig,
          resolve,
          reject
        );
      }, reject);
    });
  },

  writeDefaultUserConfigIfNone: function () {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        var pathToFile = sc.url + 'dnscrypt/dnscrypt-user.toml';
        function doWrite() {
          HelpersConfig.writeDefaultUserConfig()
            .then(resolve)
            .catch(reject);
        }

        window.resolveLocalFileSystemURL(pathToFile, function (fe) {
          fe.file(function (f) {
            if (f.size > 0) {
              resolve();
            } else {
              doWrite();
            }
          }, reject);
        }, doWrite);
      }, reject);
    });
  },

  storeMainConfig: function () {
    var serverNames = resolversList.getItems();
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        config.store(sc.url + 'dnscrypt', 'dnscrypt.toml', sc.path, serverNames)
          .then(function () {
            eventBus.emit('config:saved:main');
          })
          .then(resolve)
          .catch(reject);
      }, reject);
    });
  },

  fetchMainConfig: function () {
    return utilsConfig.readConfig('dnscrypt/dnscrypt.toml')
      .then(function (txt) {
        return new Promise(function (resolve) {
          config.loadTOML(txt);
          eventBus.emit('config:loaded:main', config);
          resolve();
        });
      });
  },

  restoreMainConfig: function () {
    return HelpersConfig.writeDefaultUserConfig()
      .then(function () {
        return utilsConfig.readConfig('dnscrypt/dnscrypt-user.toml');
      })
      .then(function (txt) {
        config.loadTOML(txt);
      })
      .then(HelpersConfig.storeMainConfig)
      .then(helpersDNSSettings.reloadSettingsFromMainConfig)
      .then(HelpersConfig.downloadResolversIfNone)
      .then(HelpersConfig.cacheResolversListStats)
      .then(function () {
        return resolversList.reloadData();
      });
  },

  checkNoResolversSelectedAndConfirm: function (app) {
    var emptyListDoNotAsk = false;

    function checkAndAsk() {
      return new Promise(function (resolve) {
        var serverNames = config.get('server_names');
        if (emptyListDoNotAsk || (_isArray(serverNames) && serverNames.length > 0)) {
          resolve(true);
        } else {
          app.dialog.create({
            verticalButtons: true,
            title: 'Warning',
            text: '<p>You haven\'t selected any resolver. DNSCloak will use all available resolvers from configured list. This may cause long service initialization delay. Do you want to continue?</p><p><label class="checkbox"><input name="empty-not-ask" type="checkbox"><i class="icon-checkbox"></i></label> Do not ask again</p>',
            buttons: [
              {
                text: 'Continue',
                color: 'red',
                onClick: function (dialog) {
                  if ($$('input[name="empty-not-ask"]').is(':checked')) {
                    emptyListDoNotAsk = true;
                    prefsStore.store('emptyListDoNotAsk', true);
                  }
                  dialog.close(true);
                  resolve(true);
                }
              },
              {
                text: 'Cancel',
                onClick: function (dialog) {
                  dialog.close(true);
                  resolve(false);
                }
              }
            ]
          }).open();
        }
      });
    }

    return prefsStore.fetch('emptyListDoNotAsk')
      .then(function (obj) {
        if (obj !== null) emptyListDoNotAsk = obj;
      })
      .then(checkAndAsk)
      .catch(checkAndAsk);
  }
};

module.exports = HelpersConfig;
