/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var ap = require('./app-prefs');

function PrefsStore(suite) {
  var prefs;
  function lazyInit() {
    if (!prefs) prefs = plugins.appPreferences.suite(suite);
  }
  _extend(this, {
    store: function (key, data) {
      lazyInit();
      return prefs.store(key, data);
    },
    fetch: function (key) {
      lazyInit();
      return prefs.fetch(key);
    }
  });
}


module.exports = new PrefsStore('group.' + ap.APP_BUNDLE);
