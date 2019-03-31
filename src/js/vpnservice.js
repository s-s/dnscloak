/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var i18n = require('./utils/i18n');
var eventBus = require('./eventbus');
var helpersConfig = require('./helpers/config');
var helpersDNSSettings = require('./helpers/dnssettings');
var ap = require('./app-prefs');

function VPNServiceManager() {
  this.currentState = 0;
  this.profileInstalled = false;

  var startServerOnDisconnect = false;

  _extend(this, {
    init: function (app) {
      var self = this;
      self.app = app;
      $$(document).on('vpn:state:changed', function (e) {
        var state = e.state;
        if (ap.DEBUG) console.log('CURRENT VPN STATE = ' + state);
        if (state == -1) {
          self.currentState = 0;
          self.profileInstalled = false;
        } else {
          self.currentState = state;
        }

        if (startServerOnDisconnect && (!self.currentState || self.currentState == 1)) { //disconnected
          startServerOnDisconnect = false;
          dnstool.startExt(function () {});
        }
        _refreshUI(self);
      });

      dnstool.setupListener();

      $$(document).on('resume', function () {
        dnstool.getStatus(function (state) {
          cordova.fireDocumentEvent('vpn:state:changed', {
            state: state
          });
        }, function () {
          if (ap.DEBUG) console.log('error getStatus');
        });
      }, false);

      _refreshUI(self);

      if (ap.DEBUG && ap.UITEST && ap.EMULATOR) {
        return new Promise(function (resolve) {
          resolve();
        });
      } else {
        var out = new Promise(function (resolve) {
          dnstool.checkPermission(function (data) {
            if (data == 1) {
              self.profileInstalled = true;
            }
            resolve();
          }, function () {
            if (ap.DEBUG) console.log('error checkPermission');
            resolve();
          });
        });

        return out.then(function () {
          return new Promise(function (resolve) {
            dnstool.getStatus(function (state) {
              self.currentState = state;
              resolve();
            }, function () {
              if (ap.DEBUG) console.log('error getStatus');
              resolve();
            });
          });
        }).then(function () {
          _refreshUI(self);
        });
      }
    },

    start: function () {
      dnstool.startExt(function () {
        eventBus.emit('vpnservice:started');
      }, function (err) {
        if (ap.DEBUG) console.log(err);
      });
    },

    stop: function () {
      if (this.currentState && this.currentState > 1) {
        dnstool.stopExt(function () {});
      }
    },

    restartIfRunning: function (allowStart) {
      if (this.currentState > 1) {
        startServerOnDisconnect = true;
        this.stop();
      } else if (allowStart) {
        _checkPermissionAndStartProxy(this);
      }
    }
  });
}

function _checkPermissionAndStartProxy(vpnManager) {
  dnstool.checkPermission(function (data) {
    if (ap.DEBUG) console.log('ok checkPermission');
    if (data == 1) {
      vpnManager.start();
    } else {
      dnstool.requestPermission(ap.APP_BUNDLE + '.DNSCryptAppExt', i18n.t('profile-title', ap.APP_NAME), 'group.' + ap.APP_BUNDLE, function () {
        vpnManager.profileInstalled = true;
        _refreshUI(vpnManager);
        dnstool.setupListener();
        vpnManager.start();
      });
    }
  }, function () {
    if (ap.DEBUG) console.log('error checkPermission');
  });
}

function _refreshUI(vpnManager) {
  var app = vpnManager.app;
  var currentState = vpnManager.currentState;
  if (vpnManager.profileInstalled) {
    $$('.remove-profile-div').removeClass('hidden');

    if (ap.DEBUG) console.log('state ---->');
    if (ap.DEBUG) console.log(currentState);

    if (!currentState || currentState == 1) { //disconnected
      $$('.remove-profile').removeClass('disabled');
      $$('.dns-control-button')
        .removeClass('changing')
        .removeClass('connected');

      $$('.dns-control-button i')
        .removeClass('ion-stop')
        .addClass('ion-play');
      app.dialog.close();
      $$('.modal-overlay.modal-overlay-visible').remove(); //fixxxy fix
    } else if (currentState == 3) { //connected
      $$('.dns-control-button')
        .removeClass('changing')
        .addClass('connected');

      $$('.dns-control-button i')
        .removeClass('ion-play')
        .addClass('ion-stop');

      $$('.remove-profile').addClass('disabled');
      app.dialog.close();
      $$('.modal-overlay.modal-overlay-visible').remove(); //fixxxy fix
    } else if (currentState == 2 || currentState == 4) { //connecting, reconnecting
      app.dialog.create({
        title: 'Starting DNS service',
        text: '<div class="preloader"></div>',
        buttons: [{
          text: 'Stop',
          color: 'red',
          onClick: function (dialog) {
            dialog.close(true);
            if (helpersDNSSettings.isOnDemandEnabled()) {
              dnstool.disableOnDemand(function () {
                vpnManager.stop();
              });
            } else {
              vpnManager.stop();
            }
          }
        }]
      }).open();

      $$('.dns-control-button')
        .addClass('changing')
        .removeClass('connected');

      $$('.dns-control-button i')
        .removeClass('ion-play')
        .addClass('ion-stop');
      $$('.remove-profile').addClass('disabled');
    } else if (currentState == 5) { //disconnecting
      app.dialog.preloader('Stopping DNS service');
      $$('.dns-control-button')
        .addClass('changing')
        .removeClass('connected');

      $$('.dns-control-button i')
        .removeClass('ion-play')
        .addClass('ion-stop');
      $$('.remove-profile').addClass('disabled');
    }
  } else {
    $$('.remove-profile-div').addClass('hidden');
    app.dialog.close();
    $$('.modal-overlay.modal-overlay-visible').remove(); //fixxxy fix

    $$('.dns-control-button i')
      .removeClass('ion-stop')
      .addClass('ion-play');
  }
}


var sharedVPNManager = new VPNServiceManager();

$$(document).on('click', 'a.remove-profile', function () {
  dnstool.removeProfile(function () {
    sharedVPNManager.profileInstalled = false;
    _refreshUI(sharedVPNManager);
  });
});

$$(document).on('click', 'a.dns-control-button:not(.connected):not(.changing)', function () {
  helpersConfig.checkNoResolversSelectedAndConfirm(sharedVPNManager.app)
    .then(function (ok) {
      if (ok) {
        if (helpersDNSSettings.isOnDemandEnabled()) {
          dnstool.enableOnDemand(function() {
            _checkPermissionAndStartProxy(sharedVPNManager);
          });
        } else {
          _checkPermissionAndStartProxy(sharedVPNManager);
        }
      }
    });
});

$$(document).on('click', 'a.dns-control-button.changing', function () {
  if (helpersDNSSettings.isOnDemandEnabled()) {
    dnstool.disableOnDemand(function () {
      sharedVPNManager.stop();
    });
  } else {
    sharedVPNManager.stop();
  }
});

$$(document).on('click', 'a.dns-control-button.connected:not(.changing)', function () {
  if (helpersDNSSettings.isOnDemandEnabled()) {
    dnstool.disableOnDemand(function () {
      sharedVPNManager.stop();
    });
  } else {
    sharedVPNManager.stop();
  }
});

module.exports = sharedVPNManager;
