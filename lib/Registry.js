var array = require("d3-array"),
    queue = require("d3-queue");

var registries = [];

function Registry() {

}

Registry.prototype = {
  url: null,
  loadModule: function(url, callback) {
    process.nextTick(function() {
      callback(new Error("not implemented"));
    });
  },
  findModules: function(query, callback) {
    process.nextTick(function() {
      callback(new Error("not implemented"));
    });
  },
  toString: function() {
    return this.url;
  }
};

Registry.register = function(registry) {
  registries.push(registry);
};

Registry.unregister = function(registry) {
  registries.splice(registries.indexOf(registry));
};

Registry.loadModule = function(url, callback) {
  var q = queue();

  registries.forEach(function(registry) {
    q.defer(function(callback) {
      registry.loadModule(url, callback);
    });
  });

  q.awaitAll(function(error, modules) {
    if (error) return void callback(error);
    callback(null, modules.filter(function(module) { return module != null; })[0]);
  });
};

Registry.findModules = function(query, callback) {
  var q = queue();

  registries.forEach(function(registry) {
    q.defer(function(callback) {
      registry.findModules(query, callback);
    });
  });

  q.awaitAll(function(error, modules) {
    if (error) return void callback(error);
    callback(null, array.merge(modules));
  });
};

module.exports = Registry;
