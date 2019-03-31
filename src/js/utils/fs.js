/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';
var ap = require('./../app-prefs');

module.exports = {
  getGroupDir: function() {
    return new Promise(function (resolve, reject) {
      dnstool.getGroupDir('group.' + ap.APP_BUNDLE, resolve, reject);
    });
  },

  writeDataToFile: function (dirName, fileName, content, success, fail) {
    var blob = new Blob([content], {
      type: 'text/plain'
    });

    window.resolveLocalFileSystemURL(dirName, function (dirEntry) {
      dirEntry.getFile(fileName, {
        create: true,
        exclusive: false
      }, function (fileEntry) {
        fileEntry.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            if (typeof success === 'function') success();
          };

          fileWriter.onerror = function (e) {
            if (typeof fail === 'function') fail(e);
          };

          fileWriter.write(blob);
        });
      });
    });
  },

  readDataFromFile: function (fileUrl) {
    return new Promise(function (resolve, reject) {
      window.resolveLocalFileSystemURL(fileUrl, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function () {
            resolve(this.result);
          };
          reader.readAsText(file);
        });
      }, function (e) {
        if (ap.DEBUG) console.log(e);
        reject(e);
      });
    });
  },

  removeFile: function (dirEntry, fileName) {
    return new Promise(function (resolve) {
      dirEntry.getFile(
        fileName,
        {
          create: false
        },
        function (fileEntry2) {
          fileEntry2.remove(resolve, resolve);
        },
        resolve
      );
    });
  }
};
