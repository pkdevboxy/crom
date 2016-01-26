var fs = require("fs"),
    path = require("path");

function Package(dir, index) {
  this.dir = dir;
  this._index = index;
}

Package.prototype = {
  install: function(module, callback) {
    callback(new Error("not yet implemented"));
  },
  uninstall: function(module, callback) {
    callback(new Error("not yet implemented"));
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
