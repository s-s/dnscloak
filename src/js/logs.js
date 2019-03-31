/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var utilsFS = require('./utils/fs');
var mainView = require('./f7app').mainView;

$$(document).on('click', 'a.log-share', function () {
  var options = {
    message: $$('#dns-log').text(),
    subject: 'DNSCloak Log'
  };

  window.plugins.socialsharing.shareWithOptions(options, function () {}, function () {});
});

function readLog(logfile) {
  return new Promise(function (resolve) {
    utilsFS.getGroupDir().then(function (x) {
      utilsFS.readDataFromFile(x.url + logfile)
        .then(resolve)
        .catch(function () {
          resolve('');
        });
    });
  });
}

function setLogContent(fileName) {
  return readLog(fileName).then(function (l) {
    $$('#dns-log').html(l);
    $$('div.page[data-name="logs"] .page-content').scrollTop($$('div.page[data-name="logs"] .page-content')[0].scrollHeight);
  });
}

$$(document).on('click', 'a.log-refresh', function () {
  setLogContent($$('#dns-log').data('log-file'));
});

function registerLogLink(selector, fileName) {
  $$(document).on('click', selector, function () {
    $$('#dns-log').data('log-file', fileName);
    $$('#dns-log').html('');
    mainView.router.navigate('/logs/');
    setLogContent(fileName);
  });
}

registerLogLink('a.dns-log', 'dnscrypt/logs/dns.log');
registerLogLink('a.dns-log-query', 'dnscrypt/logs/query.log');
registerLogLink('a.dns-log-nx', 'dnscrypt/logs/nx.log');
registerLogLink('a.blacklist-log', 'dnscrypt/logs/blocked.log');
registerLogLink('a.whitelist-log', 'dnscrypt/logs/whitelist.log');
registerLogLink('a.ipblacklist-log', 'dnscrypt/logs/ip_blocked.log');
