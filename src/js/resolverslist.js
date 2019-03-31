/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var Template7 = require('framework7/framework7.esm.bundle.js').Template7;

var config = require('./config').shared;
var eventBus = require('./eventbus');
var utilsSources = require('./utils/sources');
var ap = require('./app-prefs');

var _wrap = require('lodash/wrap');
var _bind = require('lodash/bind');
var _reject = require('lodash/reject');

function ResolversList () {
  this.listData = [];
}

function _filterUserList(list) {
  var ok_ip, ok_proto, ok_props,
    ok_selected, onlySelected = $$('a.only-selected').is('.selected'),
    serverNames = config.get('server_names');
  return _filter(list, function (item) {
    ok_ip = true;
    ok_proto = true;
    ok_props = true;

    ok_selected = true;

    if (!config.get('ipv4_servers') && !item.doh && _has(item, 'ipv4') && item.ipv4) ok_ip = false;
    if (!config.get('ipv6_servers') && !item.doh && _has(item, 'ipv6') && item.ipv6) ok_ip = false;

    if (!config.get('dnscrypt_servers') && !item.doh) ok_proto = false;
    if (!config.get('doh_servers') && item.doh) ok_proto = false;

    if (config.get('require_nolog') && !item.nologs) ok_props = false;
    if (config.get('require_dnssec') && !item.dnssec) ok_props = false;
    if (config.get('require_nofilter') && !item.no_filter) ok_props = false;

    if (onlySelected && !_includes(serverNames, item.name)) ok_selected = false;

    return ok_ip && ok_proto && ok_props && ok_selected;
  });
}

_extend(ResolversList.prototype, {
  init: function (app) {
    var self = this;
    var itms = _filterUserList(self.listData);

    if (_isArray(itms) && itms.length > 0) {
      $$('div.page[data-name="index"] div.dns-list-loading').addClass('hidden');
      $$('div.navbar-inner[data-name="index"] div.subnavbar').removeClass('hidden');
      $$('div.virtual-list.dnslist-list').removeClass('hidden');

      $$('a.only-selected').removeClass('hidden');
    } else {
      $$('div.page[data-name="index"] div.dns-list-loading').removeClass('hidden');
      $$('div.navbar-inner[data-name="index"] div.subnavbar').addClass('hidden');
      $$('div.virtual-list.dnslist-list').addClass('hidden');

      $$('a.only-selected').addClass('hidden');
    }

    $$(document).on('click', 'a.only-selected', function () {
      if ($$(this).is('.selected')) {
        $$(this)
          .removeClass('selected')
          .addClass('color-gray');
      } else {
        $$(this)
          .addClass('selected')
          .removeClass('color-gray');
      }

      self.listView.replaceAllItems(_filterUserList(self.listData));

      var sb = $$('form.dnslist-search')[0].f7Searchbar;

      if ($$('form.dnslist-search.searchbar-active').length > 0 && sb.query) {
        sb.search(sb.query);
      } else {
        self.listView.resetFilter();
      }
    });

    self.listView = app.virtualList.create({
      el: 'div.page[data-name="index"] .virtual-list.dnslist-list',
      rowsBefore: 50,
      rowsAfter: 50,
      items: itms,
      searchAll: function (query, items) {
        query = query.toLowerCase();
        var found = [];
        var trimmedQuery = query.trim();
        var onlySelected = $$('a.only-selected').is('.selected');
        var i;
        var ok;
        var serverNames = config.get('server_names');
        for (i = 0; i < items.length; i++) {
          ok = false;

          if (trimmedQuery === '') ok = true;
          if (!ok && items[i].name && items[i].name.toLowerCase().indexOf(query) >= 0) ok = true;
          if (!ok && items[i].description && items[i].description.toLowerCase().indexOf(query) >= 0) ok = true;

          if (ok && onlySelected) {
            if (!_includes(serverNames, items[i].name)) {
              ok = false;
            }
          }

          if (ok) found.push(i);
        }
        return found;
      },
      itemTemplate: '<li class="swipeout accordion-item {{colorClass name}}" data-dns-id="{{name}}">' +
        '<a class="item-content item-link">' +
        '<div class="item-inner">' +
        '<div class="item-title-row">' +
        '<div class="item-title">{{name}}</div>' +
        '<div class="item-after"></div>' +
        '</div>' +
        '<div class="item-subtitle">' +
        '{{#if static}}<div class="chip"><div class="chip-label">Static</div></div>{{/if}} ' +
        '{{#if doh}}<div class="chip"><div class="chip-label">DoH</div></div>{{/if}} ' +
        '{{#if nologs}}<div class="chip"><div class="chip-label">No logs</div></div>{{/if}} ' +
        '{{#if dnssec}}<div class="chip"><div class="chip-label">DNSSEC</div></div>{{/if}} ' +
        '{{#unless no_filter}}<div class="chip"><div class="chip-label">Filters</div></div>{{/unless}} ' +
        '</div>' +
        '<div class="item-text">{{description}}</div>' +
        '</div>' +
        '</a>' +
        '<div class="accordion-item-content">' +
        '<div class="block">' +
        '<a href="#" class="button button-big dns-use" data-i18n="use-server" data-dns-id="{{name}}">{{useLabel name}}</a>' +
        '</div>' +
        '</div>' +
        '</li>',
      height: 111
    });

    (function () {
      self.listView.resetFilter = _wrap(self.listView.resetFilter, function (func) {
        var sb = $$('form.dnslist-search')[0].f7Searchbar;

        if ($$('form.dnslist-search.searchbar-active').length > 0 && sb.query) {
          sb.search(sb.query);
        } else {
          $$('div.page[data-name="index"] div.searchbar-not-found').hide();
          if (self.listView.items && self.listView.items.length > 0) {
            $$('div.page[data-name="index"] div.searchbar-found').show();
          }
        }
        func = _bind(func, this);
        return func();
      });
    })();
  },

  updateView: function () {
    if (this.listView) {
      this.listView.replaceAllItems(_filterUserList(this.listData));
      this.listView.resetFilter();
      $$('form.dnslist-search')[0].f7Searchbar.disable();
    }
  },

  getItems: function () {
    if (this.listView && this.listView.items) {
      return this.listView.items;
    }
    return [];
  }
});

_extend(ResolversList.prototype, {
  reloadData: function () {
    var self = this;
    return utilsSources.readResolvers(config)
      .then(function (list) {
        if (ap.DEBUG) {
          console.log('resolvers list loaded');
          console.log(list);
        }

        return new Promise(function (resolve) {
          if (ap.DEBUG && ap.UITEST && !ap.EMULATOR) {
            self.listData = [
              {
                name: 'dns-dummy',
                description: 'Powerful DNSCrypt resolver with ads filtering and family protection.',
                dnssec: true,
                nologs: true,
                no_filter: false
              },

              {
                name: 'dns-dummy-doh',
                description: 'Powerful DNS resolver with DoH support, ads filtering and family protection.',
                dnssec: true,
                nologs: true,
                no_filter: false,
                doh: true
              }
            ];
          } else {
            self.listData = list;
          }
          self.updateView();
          resolve();
        });
      });
  }
});

var sharedResolversList = new ResolversList();

Template7.registerHelper('colorClass', function (name) {
  return _includes(config.get('server_names'), name) ? 'dns-selected' : '';
});

Template7.registerHelper('useLabel', function (name) {
  return _includes(config.get('server_names'), name) ? 'Stop using this server' : 'Use this server';
});

$$(document).on('accordion:opened', '.virtual-list.dnslist-list li', function () {
  var $el = $$(this);
  var listView = sharedResolversList.listView;

  if (listView.$pageContentEl.height() < ($el.offset().top + $el.height())) {
    listView.$pageContentEl.scrollTop(
      listView.$pageContentEl.scrollTop() +
      ($el.offset().top + $el.height()) -
      listView.$pageContentEl.height(), 100
    );
  } else {
    var elTop = $el.offset().top,
      barsHeight,
      barsHeightFull;

    if ($$('.view > .navbar').offset().top < 0) {
      barsHeightFull = ($$('.view > .navbar .subnavbar').offset().top + $$('.view > .navbar .subnavbar').height() + $$('.view > .navbar').height());
      barsHeight = ($$('.view > .navbar .subnavbar').offset().top + $$('.view > .navbar .subnavbar').height());
    } else {
      barsHeightFull = ($$('.view > .navbar').offset().top + $$('.view > .navbar .subnavbar').height() + $$('.view > .navbar').height());
      barsHeight = ($$('.view > .navbar').offset().top + $$('.view > .navbar .subnavbar').height() + $$('.view > .navbar').height());
    }

    if (elTop < barsHeight) {
      var newScroll = listView.$pageContentEl.scrollTop() + elTop - barsHeightFull;
      if (newScroll < 0) newScroll = 0;
      listView.$pageContentEl.scrollTop(newScroll, 100);
    }
  }
});

$$(document).on('page:beforein', 'div.page[data-name="index"]', function () {
  if (sharedResolversList.listView) sharedResolversList.listView.resetFilter();
  $$('form.dnslist-search')[0].f7Searchbar.disable();
});

$$(document).on('click', 'a.dns-use', function () {
  var server = $$(this).data('dns-id');

  if (!_isArray(config.get('server_names'))) config.set('server_names', []);

  var serverNames = config.get('server_names');

  if (_includes(serverNames, server)) {
    config.set('server_names', _reject(serverNames, function (el) {
      return el === server;
    }));
    $$('.dnslist-list li[data-dns-id="' + server + '"]').removeClass('dns-selected');
    $$(this).html('Use this server');
    eventBus.emit('resolvers-list:resolver:deselected', server);
  } else {
    serverNames.push(server);
    $$('.dnslist-list li[data-dns-id="' + server + '"]').addClass('dns-selected');
    $$(this).html('Stop using this server');
    eventBus.emit('resolvers-list:resolver:selected', server);
  }
});

$$('form.dnslist-search input[type="search"]').on('focus', function () {
  $$(this).addClass('focused');
  $$('div.page[data-name="index"] div.searchbar-overlay').addClass('searchbar-focused');
});

$$('form.dnslist-search').on('disableSearch', function () {
  $$(this).find('input').removeClass('focused');
  $$('div.page[data-name="index"] div.searchbar-overlay').removeClass('searchbar-focused');
});

module.exports = sharedResolversList;
