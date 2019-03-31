/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var helpersUI = {
  configCheckbox: function (config, option) {
    $$(document).on('click', 'form.main-form label.item-checkbox[data-name="' + option + '"]:not(.disabled)', function () {
      setTimeout(function () {
        config.set(option, !!$$('form.main-form input[name="' + option + '"]').prop('checked'));
      }, 10);
    });
  },
  configToggle: function (config, option) {
    $$(document).on('click', 'form.main-form label.toggle[data-name="' + option + '"]:not(.disabled)', function () {
      setTimeout(function () {
        config.set(option, !!$$('form.main-form input[name="' + option + '"]').prop('checked'));
      }, 10);
    });
  },
  configToggleObject: function (config, option) {
    $$(document).on('click', 'form.main-form label.toggle[data-name="' + option + '"]:not(.disabled)', function () {
      setTimeout(function () {
        config.set(option, !!$$('form.main-form input[name="' + option + '"]').prop('checked'));

        if ($$('form.main-form input[name="' + option + '"]').prop('checked')) {
          if (!_isObject(config[option])) config.set(option, {});
        } else {
          config.set(option, false);
        }
      }, 10);
    });
  },
  setInputValueRaw: function (option, value) {
    $$('form.main-form input[name="' + option + '"]').prop({
      checked: value
    });
  },
  setInputValue: function (option, config) {
    helpersUI.setInputValueRaw(option, !!config.get(option));
  }
};

module.exports = helpersUI;
