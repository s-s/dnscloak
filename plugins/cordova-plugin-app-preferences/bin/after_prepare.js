'use strict';

module.exports = function (context) {
	var Q = require('q'),
		path = require('path'),
		ET = require('elementtree'),
		cordova = require('cordova'),
		fs = require("./lib/filesystem")(Q, require('fs'), path),
		settings = require("./lib/settings")(fs, path),
		platforms = {};

	platforms.android = require("./lib/android")(context);
	platforms.ios = require("./lib/ios")(Q, fs, path, require('plist'), require('xcode'));
	// platforms.browser = require("./lib/browser")(Q, fs, path, require('plist'), require('xcode'));

	return settings.get()
		.then(function (config) {
			var promises = [];
			context.opts.platforms.forEach (function (platformName) {
				if (platforms[platformName] && platforms[platformName].build) {
					promises.push (platforms[platformName].build (config));
				}
			});
			return Q.all(promises);
		})
		.catch(function(err) {
			if (err.code === 'NEXIST') {
				console.log("app-settings.json not found: skipping build");
				return;
			}

			console.log ('unhandled exception', err);

			throw err;
		});
};
