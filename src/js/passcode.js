/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var prefsStore = require('./prefs');

function _setPasscode() {
  prefsStore.fetch('pinsalt').then(function (obj) {
    if (obj !== null) {
      pinlock.showLockCheckThenChange();
    } else {
      pinlock.showLockChange();
    }
  });
}

function _updateResetPassState() {
  return prefsStore.fetch('pinsalt').then(function (obj) {
    if (obj !== null) {
      $$('a.reset-passcode').removeClass('hidden');
    } else {
      $$('a.reset-passcode').addClass('hidden');
    }
  });
}

function _resetPasscode() {
  prefsStore.fetch('pinsalt').then(function (obj) {
    if (obj !== null) {
      pinlock.showLockRemove();
    }
  });
}

function PasscodeManager() {
  var uiLocked;

  function _checkPasscode() {
    if (uiLocked) return;

    return new Promise(function (resolve, reject) {
      prefsStore.fetch('pinsalt')
        .then(function (obj) {
          if (obj !== null) {
            uiLocked = true;
            $$(document).once('pinlock:unlock:success', function () {
              uiLocked = false;
              resolve();
            });
            pinlock.showLockNormal(false);
          } else {
            uiLocked = false;
            resolve();
          }
        })
        .catch(reject);
    });
  }

  _extend(this, {
    checkPasscode: function () {
      _checkPasscode();
    },
    setupListener: function () {
      pinlock.setupListener();
    },
    updateUI: function () {
      _updateResetPassState();
    }
  });

  $$(document).on('pause', function () {
    if (!uiLocked) _checkPasscode();
  }, false);
}

$$(document).on('click', 'a.set-passcode', function () {
  _setPasscode();
});

$$(document).on('click', 'a.reset-passcode', function () {
  _resetPasscode();
});

$$(document).on('pinlock:unlock:success', function () {
  _updateResetPassState();
});

module.exports = new PasscodeManager();
