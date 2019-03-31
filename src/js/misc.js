/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var i18n = require('./utils/i18n');
var ap = require('./app-prefs');

$$(document).on('click', 'a.rate-app', function () {
  window.open('itms://itunes.apple.com/app/id' + ap.APP_ID + '?action=write-review', '_system');
});

$$(document).on('click', 'a.share', function () {
  var options = {
    message: i18n.t('share-message', 'DNSCloak helps me to stay secure!'),
    subject: ap.APP_NAME,
    url: 'https://itunes.apple.com/app/id' + ap.APP_ID
  };

  window.plugins.socialsharing.shareWithOptions(options, function () {}, function () {});
});
