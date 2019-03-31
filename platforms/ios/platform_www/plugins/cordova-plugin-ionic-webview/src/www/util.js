cordova.define("cordova-plugin-ionic-webview.IonicWebView", function(require, exports, module) {
var exec = require('cordova/exec');

var WebView = {
  convertFileSrc: function(url) {
    return url;
  },
  setServerBasePath: function(path) {
    exec(null, null, 'IonicWebView', 'setServerBasePath', [path]);
  },
  getServerBasePath: function(callback) {
    exec(callback, null, 'IonicWebView', 'getServerBasePath', []);
  },
  persistServerBasePath: function() {
    exec(null, null, 'IonicWebView', 'persistServerBasePath', []);
  }
}

module.exports = WebView;
});
