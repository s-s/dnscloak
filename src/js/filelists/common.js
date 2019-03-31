/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var utilsFS = require('./../utils/fs');
var ap = require('./../app-prefs');

var utilsLists = {
  pickAndCopyFileIfNone: function (fileName) {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        var pathToFile = sc.url + 'dnscrypt/' + fileName;

        function doPick() {
          utilsLists.pickAndCopyFile(fileName)
            .then(resolve)
            .catch(reject);
        }

        window.resolveLocalFileSystemURL(pathToFile, function (fe) {
          fe.file(function (f) {
            if (f.size > 0) {
              resolve();
            } else {
              doPick();
            }
          }, reject);
        }, doPick);
      }, reject);
    });
  },

  pickAndCopyFile: function (fileNameTo) {
    return new Promise(function (resolve, reject) {
      window.FilePicker.pickFile(function (path) {
        var fileName = path.substr(path.lastIndexOf('/') + 1);
        var fileDir = cordova.file.tempDirectory + ap.APP_BUNDLE + '-Inbox/';

        window.resolveLocalFileSystemURL(
          fileDir + fileName,
          function (fileEntry) {
            utilsFS.getGroupDir().then(function (sc) {
              window.resolveLocalFileSystemURL(sc.url + 'dnscrypt', function (dirEntry) {
                function doCopyFile() {
                  fileEntry.copyTo(dirEntry, fileNameTo,
                    function () {
                      if (ap.DEBUG) console.log('copying was successful');
                      resolve(sc.path + '/dnscrypt/' + fileNameTo);
                    },
                    function (error) {
                      if (ap.DEBUG) console.log(error);
                      reject(error);
                    }
                  );
                }

                dirEntry.getFile(fileNameTo, {
                  create: false
                }, function (fileEntry2) {
                  fileEntry2.remove(function () {
                    doCopyFile();
                  }, function () {
                    doCopyFile();
                  }, function () {
                    doCopyFile();
                  });
                }, function () {
                  doCopyFile();
                });
              });
            }, function (error) {
              if (ap.DEBUG) console.log(error);
              reject(error);
            });
          },
          function (error) {
            if (ap.DEBUG) console.log(error);
            reject(error);
          }
        );
      }, function (reason) {
        if (reason !== 'canceled') {
          if (ap.DEBUG) console.log(reason);
          //reject(reason);
        }
        reject(reason);
      }, ['public.plain-text', 'public.utf8-plain-text']);
    });
  },

  removeListFiles: function (fileNames) {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        window.resolveLocalFileSystemURL(sc.url + 'dnscrypt', function (dirEntry) {
          Promise.all(
            _map(fileNames, function (f) {
              return utilsFS.removeFile(dirEntry, f);
            })
          )
            .then(resolve)
            .catch(reject);
        }, reject);
      }, reject);
    });
  },

  fillBlacklistMmaps: function () {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        dnstool.fillPatternlist(sc.path + '/dnscrypt/blacklist.txt', function () {
          resolve(sc.path + '/dnscrypt/blacklist.txt');
        }, reject);
      }, reject);
    });
  },

  fillWhitelistMmaps: function () {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        dnstool.fillPatternlist(sc.path + '/dnscrypt/whitelist.txt', function () {
          resolve(sc.path + '/dnscrypt/whitelist.txt');
        }, reject);
      }, reject);
    });
  },

  fillIPBlacklistMmaps: function () {
    return new Promise(function (resolve, reject) {
      utilsFS.getGroupDir().then(function (sc) {
        dnstool.fillIpBlacklist(sc.path + '/dnscrypt/ip_blacklist.txt', function () {
          resolve(sc.path + '/dnscrypt/ip_blacklist.txt');
        }, reject);
      }, reject);
    });
  }
};

module.exports = utilsLists;
