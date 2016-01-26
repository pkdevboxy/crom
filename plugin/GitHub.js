var request = require("request"),
    semver = require("semver"),
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
  loadModule: function(url, callback) {
    if (!url.startsWith(this.url + "/")) return void process.nextTick(function() { callback(new Error("unsupported url: " + url)); });
    var parts = url.slice(this.url.length + 1).split("/"),
        owner = parts[0],
        name = parts[1];
    var registry = this;
    request({
      url: this._host + "/repos/" + owner + "/" + name,
      headers: headers
    }, function(error, response, body) {
      if (error) return void callback(error);
      var module;

      try {
        body = JSON.parse(body);
      } catch (error) {
        return void callback(error);
      }

      if (body.message === "Not Found") return void callback(null, null);

      try {
        module = new GitHubModule(registry._host, body);
      } catch (error) {
        return void callback(error);
      }

      callback(null, module);
    });
  },
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
  this.name = item.name;
  this.owner = item.owner.login;
  this._host = host;
  this._stars = item.stargazers_count;
}

GitHubModule.prototype = Object.assign(Object.create(new Module), {
  findRelease: function(query, callback) {
    var module = this;
    request({
      url: this._host + "/repos/" + this.owner + "/" + this.name + "/releases",
      headers: headers
    }, function(error, response, body) {
      if (error) return void callback(error);
      var releases;

      try {
        releases = JSON.parse(body)
            .filter(function(release) {
              var tag = release.tag_name;
              return tag[0] === "v"
                  && semver.valid(tag = tag.slice(1))
                  && semver.satisfies(tag, query)
                  && release.assets.some(validAsset);
            });
      } catch (error) {
        return void callback(error);
      }

      if (!releases.length) return void callback(null, null);
      callback(null, new GitHubRelease(module, releases[0]));
    });
  },
  toString: function() {
    return this.url + " (★" + formatCount(this._stars) + ")";
  }
});

function GitHubRelease(module, release) {
  var asset = release.assets.filter(validAsset)[0];
  this.module = module;
  this.url = release.html_url;
  this.version = release.tag_name.slice(1);
  this._assetUrl = asset.browser_download_url;
  this._assetName = asset.name;
}

GitHubRelease.prototype = Object.assign(Object.create(new Release), {
  download: function(stream, callback) {
    request(this._assetUrl)
        .pipe(stream)
        .on("error", callback)
        .on("close", callback);
  }
});

function validAsset(asset) {
  return /\.zip$/.test(asset.name);
}

Registry.register(new GitHub("https://api.github.com", "https://github.com"));

module.exports = GitHub;
