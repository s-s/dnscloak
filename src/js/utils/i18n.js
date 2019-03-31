/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

function I18n() {
  this.lang = 'en';
  _extend(this, {
    t: function (key, def_string) {
      if (this.locales[this.lang] && this.locales[this.lang][key]) {
        return this.locales[this.lang][key];
      } else {
        return def_string;
      }
    },
    t_html: function (el, key, attr) {
      if (this.locales[this.lang] && this.locales[this.lang][key]) {
        var tr = this.locales[this.lang][key];
        if (attr) {
          $$(el).attr(attr, tr);
        } else {
          $$(el).html(tr);
        }
      }
    },
    locales: {
      'ru': {}
    }
  });
}

module.exports = new I18n();
