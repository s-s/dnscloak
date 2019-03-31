/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var pendingChanges = false;

var prefsStore = require('./prefs');
var config = require('./config').shared;
var eventBus = require('./eventbus');
var resolversList = require('./resolverslist');
var helpersUI = require('./helpers/ui');
var helpersDNSSettings = require('./helpers/dnssettings');
var helpersConfig = require('./helpers/config');

$$(document).on('deviceready', function () {
  prefsStore.fetch('showIcon').then(function (obj) {
    if (obj === null) {
      obj = false;
      prefsStore.store('showIcon', obj);
    }
    $$('form.main-form input[name="showIcon"]').prop({
      checked: !!obj
    });
  });

  prefsStore.fetch('skipWaitResolvers').then(function (obj) {
    if (obj === null) {
      obj = false;
      prefsStore.store('skipWaitResolvers', obj);
    }
    $$('form.main-form input[name="skipWaitResolvers"]').prop({
      checked: !!obj
    });
  });

  $$('form.main-form select[name="netType"]').val(2); //IPv4 by default
  prefsStore.fetch('netType').then(function (obj) {
    if (obj !== null) {
      $$('form.main-form select[name="netType"]').val(obj);
    }
  });

  prefsStore.fetch('ssidExclusions').then(function (obj) {
    if (obj !== null) {
      $$('form.main-form textarea[name="ssidExclusions"]').text(obj.split(/\|/).join(','));
    }
  });
});

function _refreshConnectivity() {
  dnstool.getConnectivityStatus(function (x) {
    var v = 'IPv4';
    if (x == 1) {
      v = 'IPv4 + IPv6';
    } else if (x == 2) {
      v = 'IPv6';
    }

    $$('.connectivity-status').text(v);
  });
}

$$(document).on('click', 'a.refresh-connectivity', _refreshConnectivity);

$$(document).on('page:beforein', 'div.page[data-name="dnssettings"]', function () {
  _refreshConnectivity();
});

$$(document).on('change', 'select[name="log-level"]', function () {
  var self = $$(this),
    v = self.val();

  config.set('log_level', parseInt(v));
});

$$(document).on('click', 'form.main-form label.toggle[data-name="ios_mode"]:not(.disabled)', function () {
  setTimeout(function () {
    var checked = !!$$('form.main-form input[name="ios_mode"]').prop('checked');
    config.set('ios_mode', checked);
    config.set('retry_count', checked ? 5 : 0);
  }, 10);
});

$$(document).on('click', 'form.main-form label.toggle[data-name="showIcon"]:not(.disabled)', function () {
  setTimeout(function () {
    prefsStore.store('showIcon', !!$$('form.main-form input[name="showIcon"]').prop('checked'));
    pendingChanges = true;
  }, 10);
});

$$(document).on('click', 'form.main-form label.toggle[data-name="skipWaitResolvers"]:not(.disabled)', function () {
  setTimeout(function () {
    prefsStore.store('skipWaitResolvers', !!$$('form.main-form input[name="skipWaitResolvers"]').prop('checked'));
    pendingChanges = true;
  }, 10);
});

$$(document).on('change', 'form.main-form select[name="netType"]:not(.disabled)', function () {
  prefsStore.store('netType', $$(this).val());
  pendingChanges = true;
});

$$(document).on('page:beforeout', 'div.page[data-name="dnssettings"]', function () {
  function applyChanges() {
    resolversList.updateView(); //???
    eventBus.emit('dnssettings:saved:with-changes'); //TODO: diff?
    config.markClear();
    pendingChanges = false;
  }

  function finishSave() {
    var hasPendingChanges = pendingChanges || config.isDirty;
    if (hasPendingChanges) {
      helpersConfig.storeMainConfig().then(applyChanges).catch(applyChanges);
    }
  }

  var newSsidExclusions = $$('form.main-form textarea[name="ssidExclusions"]').val();
  newSsidExclusions = newSsidExclusions.replace(/[“”«»]/g, '"');
  newSsidExclusions = newSsidExclusions.replace(/[’]/g, '\'');
  newSsidExclusions = _filter(newSsidExclusions.split(/\s*(?:,|;|\r?\n)\s*/), function (l) {
    return l !== '';
  });
  newSsidExclusions = newSsidExclusions.join('|');

  prefsStore.fetch('ssidExclusions').then(function (prevExclusions) {
    if (prevExclusions === null) prevExclusions = '';
    if (newSsidExclusions !== prevExclusions) {
      pendingChanges = true;
      prefsStore.store('ssidExclusions', newSsidExclusions);
      $$('form.main-form textarea[name="ssidExclusions"]').text(newSsidExclusions.split(/\|/).join(','));
      dnstool.setSsidExclusions(newSsidExclusions, finishSave, finishSave);
    } else {
      finishSave();
    }
  }).catch(finishSave);
});

$$(document).on('click', 'form.main-form label.toggle[data-name="onDemand"]:not(.disabled)', function () {
  setTimeout(function () {
    var onDemandEnabled = $$('form.main-form input[name="onDemand"]').prop('checked');
    helpersDNSSettings.setOnDemandEnabled(onDemandEnabled);
    prefsStore.store('connectOnDemand', onDemandEnabled);

    if (onDemandEnabled) {
      dnstool.enableOnDemand();
    } else {
      dnstool.disableOnDemand();
    }
  }, 10);
});

$$(document).on('click', 'form.main-form label.toggle[data-name="disconnectOnSleep"]:not(.disabled)', function () {
  setTimeout(function () {
    if ($$('form.main-form input[name="disconnectOnSleep"]').prop('checked')) {
      dnstool.enableDisconnectOnSleep();
    } else {
      dnstool.disableDisconnectOnSleep();
    }
  }, 10);
});

module.exports = {
  registerInputs: function () {
    helpersUI.configCheckbox(config, 'ipv4_servers');
    helpersUI.configCheckbox(config, 'ipv6_servers');
    helpersUI.configCheckbox(config, 'dnscrypt_servers');
    helpersUI.configCheckbox(config, 'doh_servers');
    helpersUI.configCheckbox(config, 'require_nolog');
    helpersUI.configCheckbox(config, 'require_dnssec');
    helpersUI.configCheckbox(config, 'require_nofilter');

    helpersUI.configToggle(config, 'log_file');

    helpersUI.configToggleObject(config, 'query_log');
    helpersUI.configToggleObject(config, 'nx_log');

    helpersUI.configToggle(config, 'force_tcp');
    helpersUI.configToggle(config, 'dnscrypt_ephemeral_keys');
    helpersUI.configToggle(config, 'tls_disable_session_tickets');
    helpersUI.configToggle(config, 'block_ipv6');
    helpersUI.configToggle(config, 'cache');
  }
};
