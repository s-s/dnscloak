/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var CodeMirror = require('codemirror');
require('codemirror/mode/toml/toml');

var utilsConfig = require('./../utils/config');
var utilsFS = require('./../utils/fs');
var eventBus = require('./../eventbus');

function Editor (el, options) {
  var editor;

  _extend(this, {
    init: function () {
      editor = CodeMirror.fromTextArea(el, options);
      $$('.CodeMirror-code').addClass('no-fastclick');
    },
    setValue: function (v) {
      editor.setValue(v);
    },
    getValue: function () {
      return editor.getValue();
    },
    blur: function () {
      if (editor.hasFocus()) editor.getInputField().blur();
    }
  });
}

var configEditor = new Editor($$('#config-editor')[0], {
  mode: {
    name: 'toml'
  },
  lineNumbers: true,
  theme: 'tomorrow-night-bright',
  //lineNumbers: false,
  lineWrapping: true
});

$$(document).on('page:beforeout', 'div.page[data-name="editor"]', function () {
  configEditor.blur();
});

$$(document).on('page:beforein', 'div.page[data-name="editor"]', function () {
  utilsConfig.readConfig('dnscrypt/dnscrypt-user.toml')
    .then(function (txt) {
      configEditor.setValue(txt);
    });
});

$$(document).on('click', 'a.editor-save:not(.saving)', function () {
  configEditor.blur();

  $$('a.editor-save > i').addClass('hidden');
  $$('a.editor-save > div').removeClass('hidden');
  $$('a.editor-save').addClass('saving');

  var newConfigToml = configEditor.getValue();

  var writeUserConfigPromise = new Promise(function (resolve, reject) {
    utilsFS.getGroupDir().then(function (sc) {
      utilsFS.writeDataToFile(
        sc.url + 'dnscrypt',
        'dnscrypt-user.toml',
        newConfigToml,
        resolve,
        reject
      );
    });
  });

  writeUserConfigPromise
    .then(function () {
      eventBus.emit('editors:config:saved', newConfigToml);
    });

  $$('a.editor-save > i').removeClass('hidden');
  $$('a.editor-save > div').addClass('hidden');
  $$('a.editor-save').removeClass('saving');
});

module.exports = configEditor;
