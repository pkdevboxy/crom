function Release() {

}

Release.prototype = {
  toString: function() {
    return this.url;
  }
};

module.exports = Release;
