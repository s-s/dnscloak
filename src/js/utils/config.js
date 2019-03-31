/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var utilsFS = require('./fs');

module.exports = {
  readConfig: function (fileName) {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (x) {
        utilsFS.readDataFromFile(x.url + fileName)
          .then(resolve)
          .catch(reject);
      });
    });
  }
};
