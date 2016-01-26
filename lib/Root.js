var fs = require("fs"),
    path = require("path"),
    array = require("d3-array");

var bisect = array.bisector(function(a, b) {
  return array.ascending(a.url, b.url)
      || array.descending(a.releaseUrl, b.releaseUrl)
      || array.descending(a.version, b.version)
      || array.ascending(a.sha, b.sha);
}).left;

function Package(dir, index) {
  this.dir = dir;
  this._index = index;
}

Package.prototype = {
  install: function(release, hash, callback) {
    var module = release.module,
        dependency = {name: module.name, owner: module.owner, version: release.version, url: module.url, releaseUrl: release.url, sha: hash},
        i = bisect(this._index.dependencies, dependency),
        dependency0 = this._index.dependencies[i];
    if (dependency0 && dependency0.sha === hash) return void process.nextTick(function() { callback(null); }); // noop
    this._index.dependencies.splice(i, 0, dependency);
    this.saveIndex(callback);
  },
  saveIndex: function(callback) {
    fs.writeFile(path.join(this.dir, "crom.json"), JSON.stringify(this._index, null, 2), "utf8", callback);
  }
};

function initInstallDirectory(dir, callback) {
  fs.mkdir(path.join(dir, "crom_modules"), function(error) {
    if (error) return void fs.stat(dir, function(error2, stat) {
      if (error2 || !stat.isDirectory()) callback(error2);
      else callback(null);
    });
    callback(null);
  });
}

function createIndex(dir, callback) {
  var index = {dependencies: []};
  fs.writeFile(path.join(dir, "crom.json"), JSON.stringify(index, null, 2), "utf8", function(error) {
    if (error) return void callback(error);
    callback(null, index);
  });
}

function initIndex(dir, callback) {
  fs.readFile(path.join(dir, "crom.json"), "utf8", function(error, text) {
    if (error) return void (error.code === "ENOENT" ? createIndex(dir, callback) : callback(error));
    var index;
    try {
      index = JSON.parse(text);
    } catch (error) {
      return void callback(error);
    }
    callback(null, index);
  });
}

Package.init = function(dir, callback) {
  initInstallDirectory(dir, function(error) {
    if (error) return void callback(error);
    initIndex(dir, function(error, index) {
      if (error) return void callback(error);
      callback(null, new Package(dir, index));
    });
  });
};

module.exports = Package;
