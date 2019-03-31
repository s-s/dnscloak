cordova.define("cordova-plugin-nativestorage.NativeStorageError", function(require, exports, module) {
/**
 * NativeStorageError
 * @constructor
 */
var NativeStorageError = function(code, source, exception) {
    this.code = code || null;
    this.source = source || null;
    this.exception = exception || null;
};

// Make NativeStorageError a real Error, you can test with `instanceof Error`
NativeStorageError.prototype = Object.create(Error.prototype, {
  constructor: { value: NativeStorageError }
});

NativeStorageError.NATIVE_WRITE_FAILED = 1;
NativeStorageError.ITEM_NOT_FOUND = 2;
NativeStorageError.NULL_REFERENCE = 3;
NativeStorageError.UNDEFINED_TYPE = 4;
NativeStorageError.JSON_ERROR = 5;
NativeStorageError.WRONG_PARAMETER = 6;

module.exports = NativeStorageError;

});
