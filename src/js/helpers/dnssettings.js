/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var helpersUI = require('./ui');
var config = require('./../config').shared;
var prefsStore = require('./../prefs');

function DNSSettings () {
  var onDemandEnabled = false;

  _extend(this, {
    refreshDisconnectOnSleep: function () {
      dnstool.getDisconnectOnSleep(function (state) {
        $$('form.main-form input[name="disconnectOnSleep"]').prop({
          checked: state == 1
        });
      }, function () {});
    },

    setOnDemandEnabled: function (val) {
      onDemandEnabled = val;
    },

    isOnDemandEnabled: function () {
      return onDemandEnabled;
    },

    refreshOnDemand: function () {
      dnstool.getOnDemand(function (state) {
        if (state == 1) {
          if (!onDemandEnabled) {
            onDemandEnabled = true;
            prefsStore.store('connectOnDemand', !!onDemandEnabled);
            $$('form.main-form input[name="onDemand"]').prop({
              checked: !!onDemandEnabled
            });
          }
        } else {
          prefsStore.fetch('connectOnDemand').then(function (obj) {
            if (obj !== null) onDemandEnabled = obj;
            $$('form.main-form input[name="onDemand"]').prop({
              checked: !!onDemandEnabled
            });
          });
        }
      }, function () {});
    },

    reloadSettingsFromMainConfig: function () {
      helpersUI.setInputValue('log_file', config);
      helpersUI.setInputValue('query_log', config);
      helpersUI.setInputValue('nx_log', config);
      helpersUI.setInputValue('force_tcp', config);
      helpersUI.setInputValue('dnscrypt_ephemeral_keys', config);
      helpersUI.setInputValue('tls_disable_session_tickets', config);
      helpersUI.setInputValue('cloaking_rules', config);
      helpersUI.setInputValue('forwarding_rules', config);
      helpersUI.setInputValue('block_ipv6', config);
      helpersUI.setInputValue('cache', config);
      helpersUI.setInputValue('ios_mode', config);
      helpersUI.setInputValue('ipv4_servers', config);
      helpersUI.setInputValue('ipv6_servers', config);
      helpersUI.setInputValue('dnscrypt_servers', config);
      helpersUI.setInputValue('doh_servers', config);
      helpersUI.setInputValue('require_nolog', config);
      helpersUI.setInputValue('require_dnssec', config);
      helpersUI.setInputValue('require_nofilter', config);
      helpersUI.setInputValue('doh_servers', config);

      $$('form.main-form select[name="log-level"]').val(config.get('log_level'));

      var blacklist = config.get('blacklist');
      $$('form.main-form input[name="enableBlacklist"]').prop({
        checked: _isObject(blacklist)
      });

      $$('form.main-form input[name="enableBlacklistLog"]').prop({
        checked: _isObject(blacklist) && !!blacklist.log_file
      });

      var whitelist = config.get('whitelist');
      $$('form.main-form input[name="enableWhitelist"]').prop({
        checked: _isObject(whitelist)
      });

      $$('form.main-form input[name="enableWhitelistLog"]').prop({
        checked: _isObject(whitelist) && !!whitelist.log_file
      });

      var ip_blacklist = config.get('ip_blacklist');
      $$('form.main-form input[name="enableIPBlacklist"]').prop({
        checked: _isObject(ip_blacklist)
      });

      $$('form.main-form input[name="enableIPBlacklistLog"]').prop({
        checked: _isObject(ip_blacklist) && !!ip_blacklist.log_file
      });
    }
  });
}

module.exports = new DNSSettings();
