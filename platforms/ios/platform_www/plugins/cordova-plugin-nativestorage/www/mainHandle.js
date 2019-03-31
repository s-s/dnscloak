cordova.define("cordova-plugin-nativestorage.mainHandle", function(require, exports, module) {
var inBrowser = false;
var NativeStorageError = require('./NativeStorageError');


function isInBrowser() {
  inBrowser = (window.cordova && (window.cordova.platformId === 'browser' || window.cordova.platformId === 'osx')) || !(window.phonegap || window.cordova);
  return inBrowser;
}

function storageSupportAnalyse() {
  if (!isInBrowser()) {
    return 0;
  //storageHandlerDelegate = exec;
  } else {
    if (window.localStorage) {
      return 1;
    //storageHandlerDelegate = localStorageHandle;
    } else {
      return 2;
    //console.log("ALERT! localstorage isn't supported");
    }
  }
}

//if storage not available gracefully fails, no error message for now
function StorageHandle() {
  this.storageSupport = storageSupportAnalyse();
  switch (this.storageSupport) {
    case 0:
      var exec = require('cordova/exec');
      this.storageHandlerDelegate = exec;
      break;
    case 1:
      var localStorageHandle = require('./LocalStorageHandle');
      this.storageHandlerDelegate = localStorageHandle;
      break;
    case 2:
      console.log("ALERT! localstorage isn't supported");
      break;
    default:
      console.log("StorageSupport Error");
      break;
  }
}

StorageHandle.prototype.initWithSuiteName = function(suiteName, success, error) {
  if (suiteName === null) {
    error("Null suiteName isn't supported");
    return;
  }
  this.storageHandlerDelegate(success, error, "NativeStorage", "initWithSuiteName", [suiteName]);
};

StorageHandle.prototype.set = function(reference, value, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("The reference can't be null");
    return;
  }
  if (value === null) {
    error("a Null value isn't supported");
    return;
  }
  switch (typeof value) {
    case 'undefined':
      error("an undefined type isn't supported");
      break;
    case 'boolean': {
      this.putBoolean(reference, value, success, error);
      break;
    }
    case 'number': {
      // Good now check if it's a float or an int
      if (value === +value) {
        if (value === (value | 0)) {
          // it's an int
          this.putInt(reference, value, success, error);
        } else if (value !== (value | 0)) {
          this.putDouble(reference, value, success, error);
        }
      } else {
        error("The value doesn't seem to be a number");
      }
      break;
    }
    case 'string': {
      this.putString(reference, value, success, error);
      break;
    }
    case 'object': {
      this.putObject(reference, value, success, error);
      break;
    }
    default:
      error("The type isn't supported or isn't been recognized");
      break;
  }
};

/* removing */
StorageHandle.prototype.remove = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }

  if (inBrowser) {
    try {
      localStorage.removeItem(reference);
      success();
    } catch (e) {
      error(e);
    }
  } else {
    this.storageHandlerDelegate(success, error, "NativeStorage", "remove", [reference]);
  }
};

/* clearing */
StorageHandle.prototype.clear = function(success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (inBrowser) {
    try {
      localStorage.clear();
      success();
    } catch (e) {
      error(e);
    }
  } else {
    this.storageHandlerDelegate(success, error, "NativeStorage", "clear", []);
  }
};


/* boolean storage */
StorageHandle.prototype.putBoolean = function(reference, aBoolean, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }

  if (aBoolean === null) {
    error("a Null value isn't supported");
    return;
  }

  if (typeof aBoolean === 'boolean') {
    this.storageHandlerDelegate(function(returnedBool) {
      if ('string' === typeof returnedBool) {
        if ( (returnedBool === 'true') ) {
          success(true);
        } else if ( (returnedBool === 'false') ) {
          success(false);
        } else {
          error("The returned boolean from SharedPreferences was not recognized: " + returnedBool);
        }
      } else {
        success(returnedBool);
      }
    }, error, "NativeStorage", "putBoolean", [reference, aBoolean]);
  } else {
    error("Only boolean types are supported");
  }
};


StorageHandle.prototype.getBoolean = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(function(returnedBool) {
    if ('string' === typeof returnedBool) {
      if ( (returnedBool === 'true') ) {
        success(true);
      } else if ( (returnedBool === 'false') ) {
        success(false);
      } else {
        error("The returned boolean from SharedPreferences was not recognized: " + returnedBool);
      }
    } else {
      success(returnedBool);
    }
  }, error, "NativeStorage", "getBoolean", [reference]);
};

/* int storage */
StorageHandle.prototype.putInt = function(reference, anInt, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(success, error, "NativeStorage", "putInt", [reference, anInt]);
};

StorageHandle.prototype.getInt = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(success, error, "NativeStorage", "getInt", [reference]);
};


/* float storage */
StorageHandle.prototype.putDouble = function(reference, aFloat, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(success, error, "NativeStorage", "putDouble", [reference, aFloat]);
};

StorageHandle.prototype.getDouble = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(function(data) {
    if (isNaN(data)) {
      error('Expected double but got non-number');
    } else {
      success(parseFloat(data));
    }
  }, error, "NativeStorage", "getDouble", [reference]);
};

/* string storage */
StorageHandle.prototype.putString = function(reference, s, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(success, error, "NativeStorage", "putString", [reference, s]);
};

StorageHandle.prototype.getString = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error("Null reference isn't supported");
    return;
  }
  this.storageHandlerDelegate(success, error, "NativeStorage", "getString", [reference]);
};

/* object storage  COMPOSITE AND DOESNT CARE FOR BROWSER*/
StorageHandle.prototype.putObject = function(reference, obj, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  var objAsString = "";
  try {
    objAsString = JSON.stringify(obj);
  } catch (err) {
    error(err);
  }
  this.putString(reference, objAsString, function(data) {
    var obj = {};
    try {
      obj = JSON.parse(data);
      success(obj);
    } catch (err) {
      error(err);
    }
  }, error);
};

StorageHandle.prototype.getObject = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  this.getString(reference, function(data) {
    var obj = {};
    try {
      obj = JSON.parse(data);
      success(obj);
    } catch (err) {
      error(err);
    }
  }, error);
};

/* API >= 2 */
StorageHandle.prototype.setItem = function(reference, obj, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  var objAsString = "";
  try {
    objAsString = JSON.stringify(obj);
  } catch (err) {
    error(new NativeStorageError(NativeStorageError.JSON_ERROR, "JS", err));
    return;
  }
  if (reference === null) {
    error(new NativeStorageError(NativeStorageError.NULL_REFERENCE, "JS", ""));
    return;
  }
  this.storageHandlerDelegate(function(data) {
    try {
      obj = JSON.parse(data);
      success(obj);
    } catch (err) {
      error(new NativeStorageError(NativeStorageError.JSON_ERROR, "JS", err));
    }
  }, function(code) {
    error(new NativeStorageError(code, "Native", ""));
  }, "NativeStorage", "setItem", [reference, objAsString]);
};

StorageHandle.prototype.getItem = function(reference, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error(new NativeStorageError(NativeStorageError.NULL_REFERENCE, "JS", ""));
    return;
  }
  var obj = {};

  this.storageHandlerDelegate(
    function(data) {
      try {
        obj = JSON.parse(data);
        success(obj);
      } catch (err) {
        error(new NativeStorageError(NativeStorageError.JSON_ERROR, "JS", err));
      }
    },
    function(code) {
      error(new NativeStorageError(code, "Native", ""));
    }, "NativeStorage", "getItem", [reference]);
};

/* API >= 2 */
StorageHandle.prototype.setSecretItem = function(reference, obj, encryptConfig, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  var objAsString = "";
  try {
    objAsString = JSON.stringify(obj);
  } catch (err) {
    error(new NativeStorageError(NativeStorageError.JSON_ERROR, "JS", err));
    return;
  }
  if (reference === null) {
    error(new NativeStorageError(NativeStorageError.NULL_REFERENCE, "JS", ""));
    return;
  }

  var action = "setItem";
  var params = [reference, objAsString];
  switch (encryptConfig.mode) {
    case "password":
      action = "setItemWithPassword";
      params = [reference, objAsString, encryptConfig.value];
      break;
    case "key":
      action = "setItemWithKey";
      break;
    case "none":
      break;
    default: {
      error(new NativeStorageError(NativeStorageError.WRONG_PARAMETER, "JS", ""));
      return;
    }
  }
  this.storageHandlerDelegate(function(data) {
    try {
      obj = JSON.parse(data);
      success(obj);
    } catch (err) {
      error(new NativeStorageError(NativeStorageError.JSON_ERROR, "JS", err));
    }
  }, function(code) {
    error(new NativeStorageError(code, "Native", ""));
  }, "NativeStorage", action, params);
};

StorageHandle.prototype.getSecretItem = function(reference, encryptConfig, success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  if (reference === null) {
    error(new NativeStorageError(NativeStorageError.NULL_REFERENCE, "JS", ""));
    return;
  }
  var obj = {};

  var action = "getItem";
  var params = [reference];
  switch (encryptConfig.mode) {
    case "password":
      action = "getItemWithPassword";
      params = [reference, encryptConfig.value];
      break;
    case "key":
      action = "getItemWithKey";
      break;
    case "none":
      break;
    default: {
      error(new NativeStorageError(NativeStorageError.WRONG_PARAMETER, "JS", ""));
      return;
    }
  }

  this.storageHandlerDelegate(
    function(data) {
      try {
        obj = JSON.parse(data);
        success(obj);
      } catch (err) {
        error(new NativeStorageError(NativeStorageError.JSON_ERROR, "JS", err));
      }
    },
    function(code) {
      error(new NativeStorageError(code, "Native", ""));
    }, "NativeStorage", action, params);
};

/* list keys */
StorageHandle.prototype.keys = function(success, error) {

  //if error is null then replace with empty function to silence warnings
  if(!error){
    error = function(){};
  }

  this.storageHandlerDelegate(success, error, "NativeStorage", "keys", []);
};


var storageHandle = new StorageHandle();
module.exports = storageHandle;

});
