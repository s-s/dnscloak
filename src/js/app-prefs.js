/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var DEBUG = false;

module.exports = {
  DEBUG: DEBUG,
  UITEST: false,
  EMULATOR: false,
  BETA: false,

  APP_ID: '1452162351',
  APP_BUNDLE: 'org.techcultivation.dnscloak',
  APP_NAME: 'DNSCloak',
  APP_VERSION: '2.2.1',

  DEFAULT_LOCALE: 'en-US',
  DEFAULT_LANG: 'en',
  VALID_LANGS: {
    en: true
  },
  FALLBACK_LANGS: {},
  
  DEFAULT_RESOLVERS_URL: 'https://raw.githubusercontent.com/DNSCrypt/dnscrypt-resolvers/master/v2/public-resolvers.md',

  RECHECK_RESOLVERS_INTERVAL: DEBUG ? 5000 : (3600 * 1000)
};
