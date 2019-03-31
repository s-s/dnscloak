cordova.define("cordova-plugin-filepicker.FilePicker", function(require, exports, module) {
(function(window) {
 
    var FilePicker = function() {};
  
    FilePicker.prototype = {
  
        isAvailable: function(success) {
            cordova.exec(success, null, "FilePicker", "isAvailable", []);
        },
  
        pickFile: function(success, fail,utis, position) {
            cordova.exec(success, fail, "FilePicker", "pickFile", [utis, position]);
        }

    };
  
    cordova.addConstructor(function() {
                         
        window.FilePicker = new FilePicker();
                         
    });
  
})(window);

});
