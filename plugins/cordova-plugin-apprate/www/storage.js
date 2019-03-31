module.exports = {
  get: function (key) {
    return new Promise(function(resolve, reject) {
      NativeStorage.getItem(key, resolve, function(e) {
        if (e.code === 2) {
          resolve(null)
        } else {
          reject(e)
        }
      })
    })
  },
  set: function (key, value) {
    return new Promise(function(resolve, reject) {
      NativeStorage.setItem(key, value, resolve, reject);
    })
  }
}
