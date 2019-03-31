/**
 * @license
 * Copyright (C) 2019 Sergey Smirnov
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

'use strict';

var ap = require('./app-prefs');

function base64decode(base64) {
  // Add removed at end '='
  if ((base64.length % 4) > 0) base64 += Array(5 - base64.length % 4).join('=');

  base64 = base64
    .replace(/-/g, '+') // Convert '-' to '+'
    .replace(/_/g, '/'); // Convert '_' to '/'

  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }

  return bytes;
}

function stampDecode(stamp) {
  var out = {};
  if (stamp.substr(0, 7) !== 'sdns://') return out;

  var bin = base64decode(stamp.substr(7));
  if (bin[0] === 0x01) {
    out.proto = 'DNSCrypt';
  } else if (bin[0] === 0x02) {
    out.proto = 'DoH';
  } else {
    return out;
  }

  var props = bin[1];
  out.dnssec = !!((props >> 0) & 1);
  out.nolog = !!((props >> 1) & 1);
  out.nofilter = !!((props >> 2) & 1);
  var i = 9;
  var addrLen = bin[i++];

  function bin2String (array) {
    var result = '';
    for (var i = 0; i < array.length; i++) {
      result += String.fromCharCode(array[i]);
    }
    return result;
  }

  function toHexString (byteArray) {
    return Array.from(byteArray, function (byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }

  out.addr = bin2String(bin.slice(i, i + addrLen));
  i += addrLen;

  function dnscryptStamp() {
    var pkLen = bin[i++];
    out.pk = toHexString(bin.slice(i, i + pkLen));
    i += pkLen;
    var providerNameLen = bin[i++];
    out.providerName = bin2String(bin.slice(i, i + providerNameLen));
  }

  function dohStamp() {
    var hashLen = bin[i++];
    out.hash = toHexString(bin.slice(i, i + hashLen));
    i += hashLen;
    var hostNameLen = bin[i++];
    out.hostName = bin2String(bin.slice(i, i + hostNameLen));
    i += hostNameLen;
    var pathLen = bin[i++];
    out.path = bin2String(bin.slice(i, i + pathLen));
  }

  if (out.proto === 'DNSCrypt') {
    dnscryptStamp();
  } else if (out.proto === 'DoH') {
    dohStamp();
  }

  return out;
}

function getStampInfo(stamp) {
  var out = {
    nologs: false,
    dnssec: false,
    no_filter: false,
    doh: false
  };

  try {
    var decodedStamp = stampDecode(stamp);
    out.doh = decodedStamp.proto === 'DoH';
    out.dnssec = decodedStamp.dnssec;
    out.nologs = decodedStamp.nolog;
    out.no_filter = decodedStamp.nofilter;
    out.addr = decodedStamp.addr;

    if (decodedStamp.proto === 'DoH') {
      out.ipv4 = true;
      out.ipv6 = true;
    } else {
      out.ipv4 = !/\[/.test(out.addr);
      out.ipv6 = /\[/.test(out.addr);
    }
  } catch (e) {
    if (ap.DEBUG) console.log('---> error decode stamp: ' + stamp);
    var props = stamp[9];

    if (props === 'c') {
      out.dnssec = true;
      out.nologs = true;
      out.no_filter = true;
    } else if (props === 'M') {
      out.dnssec = true;
      out.nologs = true;
    } else if (props === 'E') {
      out.dnssec = true;
    } else if (props === 'U') {
      out.dnssec = true;
      out.no_filter = true;
    } else if (props === 'Y') {
      out.nologs = true;
      out.no_filter = true;
    } else if (props === 'I') {
      out.nologs = true;
    } else if (props === 'Q') {
      out.no_filter = true;
    }

    if (stamp[8] === 'g') {
      out.doh = true;
    }
  }

  return out;
}

function Resolver(name, prefix, stamp, description) {
  _extend(this, {
    name: prefix + name,
    description: description,
    stamp: stamp,
    nologs: false,
    dnssec: false,
    no_filter: false,
    doh: false
  }, getStampInfo(stamp));
}

module.exports = Resolver;
