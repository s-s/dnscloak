cordova.define("cordova-plugin-nativestorage.LocalStorageHandle", function(require, exports, module) {
var NativeStorageError = require('./NativeStorageError');

// args = [reference, variable]
function LocalStorageHandle(success, error, intent, operation, args) {
    var reference = args[0];
    var variable = args[1];

    if (operation.startsWith('put') || operation.startsWith('set')) {
        try {
            var varAsString = JSON.stringify(variable);
            if (reference === null) {
                error(NativeStorageError.NULL_REFERENCE);
                return;
            }
            localStorage.setItem(reference, varAsString);
            success(variable);
        } catch (err) {
            error(NativeStorageError.JSON_ERROR);
        }
    } else if (operation.startsWith('get')) {
        var item = {};
        item = localStorage.getItem(reference);
        if (item === null) {
            error(NativeStorageError.ITEM_NOT_FOUND);
            return;
        }
        try {
            var obj = JSON.parse(item);
            //console.log("LocalStorage Reading: "+obj);
            success(obj);
        } catch (err) {
            error(NativeStorageError.JSON_ERROR);
        }
    } else if (operation === 'keys') {
      var keys = [];
      for(var i = 0; i < localStorage.length; i++){
         keys.push(localStorage.key(i));
      }
      success(keys);
    }
}
module.exports = LocalStorageHandle;

});
