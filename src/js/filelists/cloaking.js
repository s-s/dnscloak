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

$$(document).on('click', 'form.main-form label.toggle[data-name="cloaking_rules"]:not(.disabled)', function () {
  setTimeout(function () {
    if ($$('form.main-form input[name="cloaking_rules"]').prop('checked')) {
      listCommon.pickAndCopyFileIfNone('cloaking_rules.txt')
        .then(function () {
          if (!config.get('cloaking_rules')) config.set('cloaking_rules', true);
        })
        .catch(function (err) {
          if (ap.DEBUG) console.log(err);
          $$('form.main-form input[name="cloaking_rules"]').prop({
            checked: false
          });
        });
    } else {
      config.set('cloaking_rules', false);
      listCommon.removeListFiles(['cloaking_rules.txt']);
    }
  }, 10);
});

$$(document).on('click', 'a.pick-cloaking', function () {
  listCommon.pickAndCopyFile('cloaking_rules.txt')
    .then(function () {
      config.set('cloaking_rules', true);
      $$('form.main-form input[name="cloaking_rules"]').prop({
        checked: true
      });
    })
    .catch(function (err) {
      if (ap.DEBUG) console.log(err);
    });
});
