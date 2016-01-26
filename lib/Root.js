var fs = require("fs"),
    os = require("os"),
    path = require("path"),
    array = require("d3-array"),
    semver = require("semver");

var bisect = array.bisector(function(a, b) {
  return array.ascending(a.url, b.url)
      || array.descending(a.releaseUrl, b.releaseUrl)
      || array.descending(a.version, b.version)
      || array.ascending(a.sha, b.sha);
}).left;

function Root(dir, index) {
  this.dir = dir;
  this._index = index;
}

Root.prototype = {
  findAll: function(name) {
    var j = name.indexOf("@"), range = "*";
    if (j >= 0) range = name.slice(j + 1), name = name.slice(0, j);
    return this._index.dependencies.filter(function(d) {
      return (d.name === name)
          || (d.owner + "/" + d.name === name)
          || (d.url === name)
          || (d.releaseUrl === name)
          || (d.url === name)
          && semver.satisfies(d.version, range);
    });
  },
  install: function(release, sha, range, callback) {
    var module = release.module,
        dependency = {name: module.name, owner: module.owner, version: release.version, range: range, url: module.url, releaseUrl: release.url, sha: sha},
        i = bisect(this._index.dependencies, dependency),
        dependency0 = this._index.dependencies[i];
    this._index.dependencies.splice(i, dependency0 && dependency0.sha === sha, dependency);
    this._save(function(error) {
      if (error) return void callback(error);
      callback(null, dependency);
    });
  },
  uninstall: function(dependency, callback) {
    var sha = dependency.sha,
        i = bisect(this._index.dependencies, dependency),
        dependency0 = this._index.dependencies[i];
    if (!dependency0 || dependency0.sha !== sha) return void process.nextTick(function() { callback(new Error("dependency not found")); });
    dependency = this._index.dependencies.splice(i, 1)[0];
    this._save(callback);
  },
  _save: function(callback) {
    fs.writeFile(path.join(this.dir, "crom.json"), JSON.stringify(this._index, null, 2) + os.EOL, "utf8", callback);
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

Root.init = function(dir, callback) {
  initInstallDirectory(dir, function(error) {
    if (error) return void callback(error);
    initIndex(dir, function(error, index) {
      if (error) return void callback(error);
      callback(null, new Root(dir, index));
    });
  });
};

module.exports = Root;
