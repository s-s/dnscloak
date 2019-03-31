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

function onIpBlacklistOptionChange() {
  setTimeout(function () {
    if ($$('form.main-form input[name="enableIPBlacklist"]').prop('checked')) {
      listCommon.pickAndCopyFileIfNone('ip_blacklist.txt')
        .then(listCommon.fillIPBlacklistMmaps)
        .then(function () {
          var ip_blacklist = config.get('ip_blacklist');
          if (!_isObject(ip_blacklist)) ip_blacklist = config.set('ip_blacklist', {});
          if ($$('form.main-form input[name="enableIPBlacklistLog"]').prop('checked')) {
            ip_blacklist.log_file = true;
          } else {
            delete ip_blacklist.log_file;
          }
          config.markDirty();
        })
        .catch(function (err) {
          if (ap.DEBUG) console.log(err);
          $$('form.main-form input[name="enableIPBlacklist"]').prop({
            checked: false
          });
        });
    } else {
      config.set('ip_blacklist', false);
      listCommon.removeListFiles([
        'ip_blacklist.txt',
        'ip_blacklist.txt.prefixes'
      ]);
    }
  }, 10);
}

$$(document).on('click', 'form.main-form label.toggle[data-name="enableIPBlacklist"]:not(.disabled)', onIpBlacklistOptionChange);
$$(document).on('click', 'form.main-form label.toggle[data-name="enableIPBlacklistLog"]:not(.disabled)', onIpBlacklistOptionChange);

$$(document).on('click', 'a.pick-ipblacklist', function () {
  listCommon.pickAndCopyFile('ip_blacklist.txt')
    .then(listCommon.fillIPBlacklistMmaps)
    .then(function () {
      var ip_blacklist = config.get('ip_blacklist');
      if (_isObject(ip_blacklist) && ip_blacklist.log_file) {
        config.set('ip_blacklist', {
          log_file: true
        });
        $$('form.main-form input[name="enableIPBlacklistLog"]').prop({
          checked: true
        });
      } else {
        config.set('ip_blacklist', {});
      }
      $$('form.main-form input[name="enableIPBlacklist"]').prop({
        checked: true
      });
    })
    .catch(function (err) {
      if (ap.DEBUG) console.log(err);
    });
});
