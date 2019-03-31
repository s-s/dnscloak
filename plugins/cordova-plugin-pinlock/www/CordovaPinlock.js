var exec = require('cordova/exec');

exports.showLockNew = function(animated, success, error) {
  exec(success, error, 'CordovaPinlock', 'showLockNew', [animated]);
};

exports.showLockChange = function(animated, success, error) {
  exec(success, error, 'CordovaPinlock', 'showLockChange', [animated]);
};

exports.showLockNormal = function(animated, success, error) {
  exec(success, error, 'CordovaPinlock', 'showLockNormal', [animated]);
};

exports.showLockVerification = function(animated, success, error) {
  exec(success, error, 'CordovaPinlock', 'showLockVerification', [animated]);
};

exports.showLockCheckThenChange = function(animated, success, error) {
  exec(success, error, 'CordovaPinlock', 'showLockCheckThenChange', [animated]);
};

exports.showLockRemove = function(animated, success, error) {
  exec(success, error, 'CordovaPinlock', 'showLockRemove', [animated]);
};

exports.setupListener = function(success, error) {
  exec(success, error, 'CordovaPinlock', 'setupListener', []);
};

exports.removeListener = function(success, error) {
  exec(success, error, 'CordovaPinlock', 'removeListener', []);
};
