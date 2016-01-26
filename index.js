var fs = require("fs"),
    path = require("path"),
    semver = require("semver");

var root = process.cwd(),
    index = require(path.join(root, "crom.json"));

exports.require = function(query) {
  var name = query, range = "*", j = query.indexOf("@");
  if (j >= 0) range = query.slice(j + 1), name = query.slice(0, j);
  var matches = index.dependencies.filter(function(d) {
    return ((d.name === name)
          || (d.owner + "/" + d.name === name)
          || (d.url === name)
          || (d.releaseUrl === name)
          || (d.url === name))
        && semver.satisfies(d.version, range);
  });
  if (matches.length > 1) {
    matches.forEach(function(m) { console.warn("? " + m.releaseUrl); });
    throw new Error("ambiguous require: " + query);
  }
  if (!matches.length) {
    throw new Error("cannot find module: " + query);
  }
  var match = matches[0],
      module = path.join(root, "crom_modules", match.sha),
      files = fs.readdirSync(module).filter(function(f) { return /\.js$/.test(f); });
  if (!files.length) {
    throw new Error("empty module: " + query);
  }
  return require(path.join(module, files[0]));
};
