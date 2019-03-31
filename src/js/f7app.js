/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var Framework7 = require('framework7/framework7.esm.bundle.js').default;

var app = new Framework7({
  root: '#app',
  theme: 'ios',
  touch: {
    tapHold: true,
    fastClicks: true,
  },
  view: {
    xhrCache: false,
    pushState: true,
    uniqueHistory: true,
  },

  popup: {
    closeByBackdropClick: true,
  },
  smartSelect: {
    openIn: 'popup',
    searchbar: true,
  },
  navbar: {
    //hideOnPageScroll: true,
    //scrollTopOnTitleClick: true,
  },
  lazy: {
    threshold: 50,
  },
  statusbar: {
    overlay: true,
    //scrollTopOnClick: true,
  },
  routes: [
    {
      path: '/settings/',
      pageName: 'settings',
    },
    {
      path: '/dnssettings/',
      pageName: 'dnssettings',
    },
    {
      path: '/editor/',
      pageName: 'editor',
    },
    {
      path: '/legal-en/',
      pageName: 'legal-en',
    },
    {
      path: '/faq-en/',
      pageName: 'faq-en',
    },
    {
      path: '/logs/',
      pageName: 'logs',
    }
  ]
});

var mainView = app.views.create('.view-main', {
  stackPages: true,
  iosDynamicNavbar: true
});

module.exports = {
  app: app,
  mainView: mainView
};
