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

function onWhitelistOptionChange() {
  setTimeout(function () {
    if ($$('form.main-form input[name="enableWhitelist"]').prop('checked')) {
      listCommon.pickAndCopyFileIfNone('whitelist.txt')
        .then(listCommon.fillWhitelistMmaps)
        .then(function () {
          var whitelist = config.get('whitelist');
          if (!_isObject(whitelist)) whitelist = config.set('whitelist', {});
          if ($$('form.main-form input[name="enableWhitelistLog"]').prop('checked')) {
            whitelist.log_file = true;
          } else {
            delete whitelist.log_file;
          }
          config.markDirty();
        })
        .catch(function (err) {
          if (ap.DEBUG) console.log(err);
          $$('form.main-form input[name="enableWhitelist"]').prop({
            checked: false
          });
        });
    } else {
      config.set('whitelist', false);
      listCommon.removeListFiles([
        'whitelist.txt',
        'whitelist.txt.suffixes',
        'whitelist.txt.prefixes'
      ]);
    }
  }, 10);
}

$$(document).on('click', 'form.main-form label.toggle[data-name="enableWhitelist"]:not(.disabled)', onWhitelistOptionChange);
$$(document).on('click', 'form.main-form label.toggle[data-name="enableWhitelistLog"]:not(.disabled)', onWhitelistOptionChange);

$$(document).on('click', 'a.pick-whitelist', function () {
  listCommon.pickAndCopyFile('whitelist.txt')
    .then(listCommon.fillWhitelistMmaps)
    .then(function () {
      var whitelist = config.get('whitelist');
      if (_isObject(whitelist) && whitelist.log_file) {
        config.set('whitelist', {
          log_file: true
        });
        $$('form.main-form input[name="enableWhitelistLog"]').prop({
          checked: true
        });
      } else {
        config.set('whitelist', {});
      }

      $$('form.main-form input[name="enableWhitelist"]').prop({
        checked: true
      });
    })
    .catch(function (err) {
      if (ap.DEBUG) console.log(err);
    });
});
