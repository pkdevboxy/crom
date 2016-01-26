var fs = require("fs"),
    path = require("path"),
    array = require("d3-array");

var bisectModule = array.bisector(function(a, b) {
  return array.ascending(a.moduleUrl, b.moduleUrl)
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
    var module = {sha: hash, moduleUrl: release.module.url, releaseUrl: release.url, version: release.version},
        i = bisectModule(this._index.modules, module),
        module0 = this._index.modules[i];
    if (module0 && module0.sha === hash) return void process.nextTick(function() { callback(null); }); // noop
    this._index.modules.splice(i, 0, module);
    this.saveIndex(callback);
  },
  saveIndex: function(callback) {
    fs.writeFile(path.join(this.dir, "crom.json"), JSON.stringify(this._index, null, 2), "utf8", callback);
  }
};

function initModuleDirectory(dir, callback) {
  fs.mkdir(path.join(dir, "crom_modules"), function(error) {
    if (error) return void fs.stat(dir, function(error2, stat) {
      if (error2 || !stat.isDirectory()) callback(error2);
      else callback(null);
    });
    callback(null);
  });
}

function createModuleIndex(dir, callback) {
  var index = {modules: []};
  fs.writeFile(path.join(dir, "crom.json"), JSON.stringify(index, null, 2), "utf8", function(error) {
    if (error) return void callback(error);
    callback(null, index);
  });
}

function initModuleIndex(dir, callback) {
  fs.readFile(path.join(dir, "crom.json"), "utf8", function(error, text) {
    if (error) return void (error.code === "ENOENT" ? createModuleIndex(dir, callback) : callback(error));
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
  initModuleDirectory(dir, function(error) {
    if (error) return void callback(error);
    initModuleIndex(dir, function(error, index) {
      if (error) return void callback(error);
      callback(null, new Package(dir, index));
    });
  });
};

module.exports = Package;
