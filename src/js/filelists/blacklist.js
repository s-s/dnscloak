/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var listCommon = require('./common');
var config = require('./../config').shared;
var ap = require('./../app-prefs');

function onBlacklistOptionChange() {
  setTimeout(function () {
    if ($$('form.main-form input[name="enableBlacklist"]').prop('checked')) {
      listCommon.pickAndCopyFileIfNone('blacklist.txt')
        .then(listCommon.fillBlacklistMmaps)
        .then(function () {
          var blacklist = config.get('blacklist');
          if (!_isObject(blacklist)) blacklist = config.set('blacklist', {});
          if ($$('form.main-form input[name="enableBlacklistLog"]').prop('checked')) {
            blacklist.log_file = true;
          } else {
            delete blacklist.log_file;
          }
          config.markDirty();
        })
        .catch(function (err) {
          if (ap.DEBUG) console.log(err);
          $$('form.main-form input[name="enableBlacklist"]').prop({
            checked: false
          });
        });
    } else {
      config.set('blacklist', false);
      listCommon.removeListFiles([
        'blacklist.txt',
        'blacklist.txt.suffixes',
        'blacklist.txt.prefixes'
      ]);
    }
  }, 10);
}

$$(document).on('click', 'form.main-form label.toggle[data-name="enableBlacklist"]:not(.disabled)', onBlacklistOptionChange);
$$(document).on('click', 'form.main-form label.toggle[data-name="enableBlacklistLog"]:not(.disabled)', onBlacklistOptionChange);

$$(document).on('click', 'a.pick-blacklist', function () {
  listCommon.pickAndCopyFile('blacklist.txt')
    .then(listCommon.fillBlacklistMmaps)
    .then(function () {
      var blacklist = config.get('blacklist');
      if (_isObject(blacklist) && blacklist.log_file) {
        config.set('blacklist', {
          log_file: true
        });
        $$('form.main-form input[name="enableBlacklistLog"]').prop({
          checked: true
        });
      } else {
        config.set('blacklist', {});
      }

      $$('form.main-form input[name="enableBlacklist"]').prop({
        checked: true
      });
    })
    .catch(function (err) {
      if (ap.DEBUG) console.log(err);
    });
});
