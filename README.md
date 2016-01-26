# Crom

Crom is an experimental, proof-of-concept package manager that avoids a centralized registry. Like other package managers, Crom allows you to install packages conveniently by name and (optional) version range:

```
crom install d3-voronoi@0.2
```

Yet upon installation, Crom expands the name to an explicit definition which is stored in the `crom.json` file:

```json
{
  "dependencies": [
    {
      "name": "d3-voronoi",
      "owner": "d3",
      "version": "0.2.1",
      "range": "0.2",
      "url": "https://github.com/d3/d3-voronoi",
      "releaseUrl": "https://github.com/d3/d3-voronoi/releases/tag/v0.2.1",
      "sha": "1eb846e5b81ea7e25dab3184fa777a8db325d01146cdae02aa589b2349d162b8"
    }
  ]
}
```

Thus, Crom allows your users to install your package and its dependencies *without a registry*: dependencies are self-describing URLs rather than names. The adoption of URLs brings us out of the AOL keyword era and onto the modern internet. Package managers should be decoupled from package registries because **authors should be free to publish their software on any platform**, and **users should be free to install software from any platform**.

### Version Discovery

Crom refers to packages by URLs, but it still provides semantic versioning! By querying the package URL, Crom can discover the available releases and chose the release that best satisfies your given version range. Thus, Crom will be able to upgrade your installed dependencies in the future by comparing them to the latest releases.

The current implementation only knows how to talk to GitHub’s [releases API](https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository), but it should be straightforward to design a simpler interchange format for release descriptions to be published anywhere on the internet.

### Package Discovery

When you ask Crom to install a package by name, it searches an extensible list of registries and installs the best match. Although this may appear less safe than a separate `search` command, installing with Crom is safe (it merely extracts a ZIP file; it doesn’t run code), and easily undoable in the case it installed the wrong thing. This:

```
crom install d3-format
```

Is equivalent to this:

```
crom install https://github.com/d3/d3-format@*
```

The current implementation is limited to GitHub’s [repository search API](https://developer.github.com/v3/search/#search-repositories), but again, it should be straightforward to extend this to other registries, such as [npm](https://npmjs.org).

While other package managers also provide similar search functionality, a critical difference is that **Crom saves the resulting match as a URL** in the `crom.json` metadata; thus, the system is decentralized but installations are still stable and deterministic for your users.

### Installing Packages

This is highly-experimental, but if you’d like to try it out, install Crom via npm:

```
npm install -g crom
```

(Yes, this step is slightly ironic. But it’s also practical!)

To install a package by name, say [d3-format](https://github.com/d3/d3-format):

```
crom install d3-format
```

You can also specify an owner name and package name together, which is useful for disambiguation:

```
crom install d3/d3-format
```

And of course you can specify a full URL:

```
crom install https://github.com/d3/d3-format
```

Once Crom finds a matching repository, it looks for the latest release that satisfies the semantic version range you specify. (If you don’t specify a version, it uses the `*` range.) For example, to install d3-format version 0.5, which currently maps to the tag [v0.5.0](https://github.com/d3/d3-format/releases/tag/v0.5.0):

```
crom install d3-format@0.5
```

If Crom finds a satisfying release, it doesn’t clone the Git repository; it looks for a ZIP file attached to your release and downloads that; if there’s no attached ZIP file, it downloads the source ZIP instead. So, you can put whatever you want inside that ZIP file—namely, generated files—and those will be installed. (Note that the content resolution logic is extensible and defined by the host registry.)

Crom extracts the ZIP file into the `crom_modules` folder, creating a subfolder for each dependency using content-addressable storage. The above command results in the following file structure:

```
crom_modules
└─┬ c7c1fee171767e72c496cd6ce88ab203b7e740c6aeb6eb5add59952337a6ffc8
  ├── LICENSE
  ├── README.md
  ├── d3-format.js
  └── d3-format.min.js
```

This means you can install multiple versions of a package or multiple packages with the same name. And because the `crom.json` file stores the associated metadata, you’ll know when anything changes.

### Loading Packages

So far, I’ve just implemented a substitute for `require` in Node. For example:

```js
var crom = require("crom"),
    format = crom.require("d3-format");
```

Since there is only one dependency named d3-format, this would succeed, loading c7c1fee. But if you had multiple packages with the same name, you’d get an error unless you specified something more explicit, such as one of these:

```js
var format = crom.require("d3-format@0.2"); // a version
var format = crom.require("d3/d3-format"); // a fork
var format = crom.require("https://github.com/d3/d3-format"); // a full url
```

Thus, Crom retains the convenience of working with short names. Crom guarantees that the names you prefer locally are explicitly defined so they have the same definition globally, all without a central registry.
