function testPlugin (cb, logger) {
var tests = {
	"bool-test": true,
	"false-test": false,
	"float-test": 123.456,
	"int-test": 1,
	"zero-test": 0,
	"string-test": "xxx",
	"empty-string-test": "",
	"string-with-quotes-test": "xx\"xx",
	"obj-test": {a: "b"},
	"arr-test": ["a", "b"],
	"empty-arr-test": []
};

var fail = [];
var pass = 0;


function addFailure (msg) {
	var err = new Error (msg);
	var errObject = {};
	for (var k in err) {
		errObject[k] = err[k]
	}
	errObject.message  = err.message;
	errObject.location = err.stack.split (/\n/)[1].match (/(\:\d+\:\d+)$/)[1];

	fail.push (msg + ';' + errObject.location);
}

var nonExistingKeyName = 'test-key-must-not-exists';

var appp = (typeof AppPreferences !== "undefined") ? new AppPreferences () : plugins.appPreferences;

var nativePlatforms = {
	iOS: true,
	Android: true,
	windows: true
};

function fetchIncrementStore (keyName) {
	var testRunCount;
	appp.fetch (keyName).then (function (value) {
		testRunCount = value || 0;
		testRunCount++;
		pass++;
	}, function (err) {
		console.error (err);
		addFailure ('promise '+keyName+' failed');
	}).then (function () {
		appp.store (keyName, testRunCount)
	}).then (function () {
		console.info ("test run #"+testRunCount);
	}, function (err) {
		console.error (err);
	});
}

fetchIncrementStore ("test-run-count");

appp.fetch ("test-promise").then (function () {
	pass++;
}, function (err) {
	addFailure ('promise fetch failed');
});

appp.fetch (function (ok) {
	if (ok === null) {
		console.log ("non existing key fetch result is success with null");
		pass++;
		appp.store (function (ok) {
			pass++;
			appp.fetch (function (ok) {
				if (ok !== null && ok) {
					pass++;
				} else {
					addFailure ('fetch>store>fetch '+nonExistingKeyName);
				}
				appp.remove (function (ok) {
					pass++;
				}, function (err) {
					addFailure ('fetch>store>fetch>remove '+nonExistingKeyName + ', error: '+err);
				}, nonExistingKeyName);
			}, function (err) {
				addFailure ('fetch>store>fetch null '+nonExistingKeyName);
			}, nonExistingKeyName);
		}, function (err) {
			addFailure ('fetch>store '+nonExistingKeyName);
		}, nonExistingKeyName, true);
	} else {
		appp.remove (function (ok) {
			pass++;
		}, function (err) {
			addFailure ('fetch>remove '+nonExistingKeyName + '="'+err+'"');
		}, nonExistingKeyName);
		addFailure ('fetch exists '+nonExistingKeyName + '="'+ok+'"');
	}
}, function (err) {
	addFailure ('fetch '+nonExistingKeyName);
}, nonExistingKeyName);

appp.fetch (function (ok) {
	if (ok === null) {
		pass++;
	} else {
		addFailure ('fetch not null '+'dict2.'+nonExistingKeyName + '="'+ok+'"');
	}
}, function (err) {
	addFailure ('fetch '+'dict2.'+nonExistingKeyName);
}, "dict2", nonExistingKeyName);

for (var testK in tests) {
	(function (testName, testValue) {
		console.log ('trying to store', testName);
		appp.store (function (ok) {
			console.log ('stored', testName);
			pass ++;
			appp.fetch (function (ok) {
				if (ok == testValue || (typeof testValue == "object" && JSON.stringify (ok) == JSON.stringify (testValue)))
					pass ++;
				else {
					console.error ('fetched incorrect value for ' + testName + ': expected ' + JSON.stringify (testValue) + ' got ' + JSON.stringify (ok));
					addFailure ('store>fetch not equal '+testName);
				}
			}, function (err) {
				console.error ('fetch value failed for ' + testName + ' and value ' + testValue);
				addFailure ('store>fetch '+testName);
			}, testName);
			if ('device' in window && device.platform && nativePlatforms[device.platform]) {
				// TODO: replace by localStorage fallback module
				var lsValue = localStorage.getItem (testName);
				if (lsValue === null) {
					pass ++;
				} else if (lsValue === testValue) {
					addFailure ('store>fetch (localStorage) '+testName);
				} else {
					console.error ('localStorage contains unexpected value: "' + lsValue + '" / "' + testValue + '"');
					pass ++;
				}
			}

		}, function (err) {
			console.error ('store value failed for ' + testName + ' and value ' + testValue);
			addFailure ('store '+testName);
		}, testName, testValue);
		console.log ('trying to store', "dict.x" + testName);
		appp.store (function (ok) {
			console.log ('stored', "dict.x" + testName);
			pass ++;
			appp.fetch (function (ok) {
				if (ok == testValue || (typeof testValue == "object" && JSON.stringify (ok) == JSON.stringify (testValue)))
					pass ++;
				else {
					console.error ('fetched incorrect value for dict.x' + testName + ': expected ' + JSON.stringify (testValue) + ' got ' + JSON.stringify (ok));
					addFailure ('store>fetch not equal '+'dict.x'+testName);
				}
			}, function (err) {
				console.error ('fetch value failed for ' + "dict.x" + testName + ' and value ' + testValue);
				addFailure ('store>fetch '+'dict.x'+testName);
			}, "dict", "x" + testName);
		}, function (err) {
			console.error ('store value failed for ' + "dictx" + testName + ' and value ' + testValue);
			addFailure ('store '+'dict.x'+testName);
		}, "dict", "x" + testName, testValue);

	}) (testK, tests[testK]);
}

setTimeout (function () {
	var prompt = 'AppPreferences plugin tests';

	if (fail && fail.length) {
		console.error ('%s passed: %d, failed: %d', prompt, pass, fail);
	} else {
		console.log ('%s — all %d passed', prompt, pass);
	}

	cb && cb (pass, fail);
}, 1000);
}

function testPluginAndCallback () {
	var contentTag = '<content src="http://127.0.0.1:50000" />';
	var url = contentTag.split ('"')[1];
	// location.href = url;
	var oReq = new XMLHttpRequest();
	oReq.addEventListener("load", function () {});

	var appp = (typeof AppPreferences !== "undefined") ? new AppPreferences () : plugins.appPreferences;

	// some css fixes
	var appNode = document.querySelector ('div.app');
	if (appNode) appNode.style.cssText = "top: 150px;";

	var deviceReadyNode = document.querySelector ('div#deviceready');
	if (deviceReadyNode) deviceReadyNode.classList.remove ('blink');

	if (deviceReadyNode) {
		var statusNode = document.createElement ('p');
		statusNode.className = 'event test';
		statusNode.style.cssText = 'display: none';
		deviceReadyNode.parentNode.appendChild (statusNode);

		deviceReadyNode.parentNode.appendChild (document.createElement ('p'));

		var showPrefsNode = document.createElement ('p');
		showPrefsNode.className = 'event prefs';
		showPrefsNode.style.cssText = 'display: block';
		deviceReadyNode.parentNode.appendChild (showPrefsNode);

		showPrefsNode.addEventListener ('click', function () {appp.show()}, false);

	}

	// end css fixes

	testPlugin (function (pass, fail) {

		var statusColor;
		var statusMessage;

		if (fail.length) {
			url += "/test/fail?" + fail.join (';');
			statusColor = '#ba4848';
			statusMessage = 'Tests failed: ' + fail + '/' + (fail + pass);
		} else {
			url += "/test/success";
			statusColor = '#48bab5';
			statusMessage = 'All tests passed';
		}

		if (deviceReadyNode) {
			statusNode.textContent = statusMessage;
			statusNode.style.cssText = 'display: block; background-color: '+statusColor+';';
			deviceReadyNode.querySelector ('.received').style.cssText = 'display: none;';

			showPrefsNode.textContent = 'Show preference pane';
			showPrefsNode.style.cssText = 'display: block; background-color: #2d2d90';
		}

		oReq.open("GET", url);
		oReq.send();
	});
}
