var fs = require("fs"),
    request = require("request"),
    semver = require("semver"),
    unzip = require("unzip"),
    format = require("d3-format");

var Registry = require("../lib/Registry"),
    Module = require("../lib/Module"),
    Release = require("../lib/Release");

var formatCount = format.format(",d");

var headers = {
  "Accept": "application/vnd.github.v3+json",
  "User-Agent": "mbostock/crom"
};

function GitHub(host, url) {
  this._host = host;
  this.url = url;
}

GitHub.prototype = Object.assign(Object.create(new Registry), {
  findModules: function(query, callback) {
    var registry = this;
    request({
      url: this._host + "/search/repositories?q=" + encodeURIComponent(query) + "&sort=stars&order=desc",
      headers: headers
    }, function(error, response, body) {
      if (error) return void callback(error);
      var modules;

      try {
        modules = JSON.parse(body)
            .items
            .filter(function(item) {
              return item.name === query
                  || item.full_name === query;
            })
            .map(function(item) { return new GitHubModule(registry._host, item); });
      } catch (error) {
        return void callback(error);
      }

      callback(null, modules);
    });
  }
});

function GitHubModule(host, item) {
  this.url = item.html_url;
  this._host = host;
  this._name = item.name;
  this._owner = item.owner.login;
  this._stars = item.stargazers_count;
}

GitHubModule.prototype = Object.assign(Object.create(new Module), {
  findRelease: function(query, callback) {
    var module = this;
    request({
      url: this._host + "/repos/" + this._owner + "/" + this._name + "/releases",
      headers: headers
    }, function(error, response, body) {
      if (error) return void callback(error);
      var release;

      try {
        release = new GitHubRelease(module, JSON.parse(body)
            .filter(function(release) {
              var tag = release.tag_name;
              return tag[0] === "v"
                  && semver.valid(tag = tag.slice(1))
                  && semver.satisfies(tag, query)
                  && release.assets.some(validAsset);
            })[0]);
      } catch (error) {
        return void callback(error);
      }

      callback(null, release);
    });
  },
  toString: function() {
    return this.url + " (★" + formatCount(this._stars) + ")";
  }
});

function GitHubRelease(module, release) {
  this.module = module;
  this.url = release.html_url;
  this.version = release.tag_name.slice(1);
  this._assetUrl = release.assets.filter(validAsset).map(function(a) { return a.browser_download_url; })[0];
}

GitHubRelease.prototype = Object.assign(Object.create(new Release), {
  download: function(path, callback) {
    request(this._assetUrl)
        .pipe(fs.createWriteStream(path))
        .on("error", callback)
        .on("end", callback);
  }
});

function validAsset(asset) {
  return /\.zip$/.test(asset.name);
}

Registry.register(new GitHub("https://api.github.com", "https://github.com"));

module.exports = GitHub;
