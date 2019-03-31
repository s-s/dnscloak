/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

require('./../css/app.scss');

var utilsCommon = require('./utils/misc');

var i18n = require('./utils/i18n');
var configEditor = require('./editors/config');
var config = require('./config').shared;

var eventBus = require('./eventbus');

var helpersConfig = require('./helpers/config');
var helpersSources = require('./helpers/sources');
var helpersDNSSettings = require('./helpers/dnssettings');

var dnsSettings = require('./dnssettings');
var passcodeManager = require('./passcode');
var resolversList = require('./resolverslist');
var vpnManager = require('./vpnservice');
var app = require('./f7app').app;

var ap = require('./app-prefs');

require('./filelists/all');
require('./misc');
require('./logs');

$$('div.page[data-name="index"]').addClass('page-on-center');
$$('body').attr('data-name', 'index');

utilsCommon.registerKeyboardBehaviour();

$$(document).on('deviceready', function () {
  AppRate.preferences = {
    openStoreInApp: true,
    displayAppName: ap.APP_NAME,
    usesUntilPrompt: 3,
    promptAgainForEachNewVersion: true,
    simpleMode: true,
    storeAppURL: {
      ios: ap.APP_ID
    },
    callbacks: {
      done: function () {}
    }
  };

  var configPromise = new Promise(function (resolve, reject) {
    helpersConfig.writeDefaultConfigIfNone()
      .then(helpersConfig.writeDefaultUserConfigIfNone)
      .then(helpersConfig.fetchMainConfig)
      .then(resolve)
      .catch(reject);
  });


  Keyboard.hideFormAccessoryBar(true);
  StatusBar.styleLightContent();

  helpersDNSSettings.refreshOnDemand();
  helpersDNSSettings.refreshDisconnectOnSleep();

  var langPromise = utilsCommon.i18nizePromise();

  $$(document).on('resume', function () {
    helpersSources.doMonitorResolversChanges();
    helpersDNSSettings.refreshOnDemand();
    helpersDNSSettings.refreshDisconnectOnSleep();
  }, false);

  var vpnInitPromise = vpnManager.init(app);

  passcodeManager.setupListener();

  var passPromise = passcodeManager.checkPasscode();

  function _showAppUI() {
    navigator.splashscreen.hide();
    StatusBar.backgroundColorByHexString('131313');
    StatusBar.show();
  }

  Promise.all([configPromise, langPromise, vpnInitPromise, passPromise])
    .then(_showAppUI)
    .then(function () {
      dnsSettings.registerInputs();
      configEditor.init();
      passcodeManager.updateUI();
      return helpersSources.downloadResolversIfNone()
        .then(helpersSources.cacheResolversListStats)
        .then(function(){
          return resolversList.reloadData();
        })
        .then(function () {
          helpersSources.startPeriodicResolversChangesCheck();
          resolversList.init(app);
          if (!ap.UITEST) AppRate.promptForRating(false);
        });
    })
    .catch(_showAppUI);
});

function restartService() {
  helpersConfig.checkNoResolversSelectedAndConfirm(app)
    .then(function (ok) {
      if (ok) {
        vpnManager.restartIfRunning(true);
      }
    });
}

eventBus.on('resolvers-list:resolver:selected', function () {
  helpersConfig.storeMainConfig().then(restartService);
});

eventBus.on('resolvers-list:resolver:deselected', function () {
  helpersConfig.storeMainConfig().then(restartService);
});

eventBus.on('dnssettings:saved:with-changes', function () {
  vpnManager.restartIfRunning();
});

eventBus.on('vpnservice:started', function () {
  if (!ap.UITEST) AppRate.promptForRating(false);
});

eventBus.on('editors:config:saved', function (newConfig) {
  try {
    config.loadTOML(newConfig);
    helpersConfig.storeMainConfig()
      .then(helpersDNSSettings.reloadSettingsFromMainConfig)
      .then(helpersSources.downloadResolversIfNone)
      .then(helpersSources.cacheResolversListStats)
      .then(function () {
        return resolversList.reloadData();
      })
      .then(function() {
        vpnManager.restartIfRunning();
      })
      .catch(function (err) {
        if (ap.DEBUG) console.log(err);
      });
  } catch (e) {
    var errMsg = '';

    if (e.constructor.name === 'TomlSyntaxError') {
      if (e.line) errMsg += 'Line ' + e.line + ': ';
      errMsg += 'Syntax error';
    }

    app.dialog.alert(errMsg, i18n.t('invalid-config', 'Invalid config'));
  }
});

eventBus.on('sources:changed', function () {
  resolversList.reloadData();
});

eventBus.on('config:loaded:main', helpersDNSSettings.reloadSettingsFromMainConfig);

$$(document).on('click', 'a.restore-defaults:not(.saving)', function () {
  app.dialog.confirm(
    i18n.t('restore-defaults-confirm', 'This will delete your config, custom resolvers lists and static servers. Default options will be applied. Do you want to continue?'),
    i18n.t('restore-defaults-title', 'Restore defaults'),
    function () {
      helpersConfig.restoreMainConfig()
        .then(function () {
          vpnManager.restartIfRunning();
          $$('a.restore-defaults i').removeClass('hidden');
          $$('a.restore-defaults div.preloader').addClass('hidden');
          $$('a.restore-defaults').removeClass('saving');
        })
        .catch(function (err) {
          if (ap.DEBUG) console.log(err);
          $$('a.restore-defaults i').removeClass('hidden');
          $$('a.restore-defaults div.preloader').addClass('hidden');
          $$('a.restore-defaults').removeClass('saving');
        });
    },
    function () {}
  );
});

$$(document).on('ptr:refresh', 'div[data-name="index"] div.ptr-content', function () {
  helpersSources.downloadResolvers()
    .then(helpersSources.cacheResolversListStats)
    .then(function () {
      return resolversList.reloadData();
    })
    .then(function () {
      app.ptr.get('div[data-name="index"] div.ptr-content').done();
    })
    .catch(function () {
      app.ptr.get('div[data-name="index"] div.ptr-content').done();
    });
});

$$(document).on('click', 'a.supportapp', function () {
  app.popup.create({
    el: 'div.popup-supportapp'
  }).open();
});

module.exports = app;
