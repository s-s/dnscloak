/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
'use strict';
var EventEmitter = require('wolfy87-eventemitter');

function EventBus() {
  var eb = new EventEmitter();

  _extend(this, {
    on: function (event, handler) {
      eb.on(event, handler);
    },
    once: function (event, handler) {
      eb.once(event, handler);
    },
    off: function (event, handler) {
      eb.off(event, handler);
    },
    emit: function (event) {
      var args = Array.prototype.slice.call(arguments, 1);
      eb.emitEvent(event, args);
    }
  });
}


module.exports = new EventBus();
