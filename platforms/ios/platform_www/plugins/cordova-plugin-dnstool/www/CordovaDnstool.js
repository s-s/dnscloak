cordova.define("cordova-plugin-dnstool.CordovaDnstool", function(require, exports, module) {
var exec = require('cordova/exec');

exports.startExt = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'startExt', []);
};

exports.stopExt = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'stopExt', []);
};

exports.checkPermission = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'checkPermission', []);
};

exports.removeProfile = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'removeProfile', []);
};

exports.setupListener = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'setupListener', []);
};

exports.removeListener = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'removeListener', []);
};

exports.getStatus = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'getStatus', []);
};

exports.getOnDemand = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'getOnDemand', []);
};

exports.setSsidExclusions = function (ssids, success, error) {
  exec(success, error, 'CordovaDnstool', 'setSsidExclusions', [ssids]);
};

exports.enableOnDemand = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'enableOnDemand', []);
};

exports.disableOnDemand = function(success, error) {
  exec(success, error, 'CordovaDnstool', 'disableOnDemand', []);
};

exports.getDisconnectOnSleep = function (success, error) {
  exec(success, error, 'CordovaDnstool', 'getDisconnectOnSleep', []);
};

exports.enableDisconnectOnSleep = function (success, error) {
  exec(success, error, 'CordovaDnstool', 'enableDisconnectOnSleep', []);
};

exports.disableDisconnectOnSleep = function (success, error) {
  exec(success, error, 'CordovaDnstool', 'disableDisconnectOnSleep', []);
};

exports.requestPermission = function(extId, title, group, success, error) {
  exec(success, error, 'CordovaDnstool', 'requestPermission', [extId, title, group]);
};

exports.getGroupDir = function(extId, success, error) {
  exec(success, error, 'CordovaDnstool', 'getGroupDir', [extId]);
};

exports.fetchLists = function (defaultResolver, ignoreSystemDNS, lists, success, error) {
  exec(success, error, 'CordovaDnstool', 'fetchLists', [defaultResolver, ignoreSystemDNS, lists]);
};

exports.fileExists = function(path, success, error) {
  exec(success, error, 'CordovaDnstool', 'fileExists', [path]);
};

exports.getFileStats = function(key, success, error) {
  exec(success, error, 'CordovaDnstool', 'getFileStats', [key]);
};

exports.fillPatternlist = function(key, success, error) {
  exec(success, error, 'CordovaDnstool', 'fillPatternlist', [key]);
};

exports.fillIpBlacklist = function(key, success, error) {
  exec(success, error, 'CordovaDnstool', 'fillIpBlacklist', [key]);
};

exports.getConnectivityStatus = function (success, error) {
  exec(success, error, 'CordovaDnstool', 'getConnectivityStatus', []);
};

});
