function Module() {

}

Module.prototype = {
  name: null,
  owner: null,
  url: null,
  findRelease: function(query, callback) {
    process.nextTick(function() {
      callback(new Error("not implemented"));
    });
  },
  toString: function() {
    return this.url;
  }
};

module.exports = Module;
