# Crom

Crom is an experimental, proof-of-concept package manager that doesn’t need its own registry. Instead, it uses GitHub as a *de facto* registry: it searches for GitHub repositories that match the name you specify, and picks the one with the highest number of stars. (Crom is built on GitHub out of convenience, but it could easily be extended to other platforms; see [open issues](https://github.com/mbostock/crom/issues).)

Crom demonstrates that package managers can be decoupled from package registries. And this is good, because **package authors should be free to publish their software on any platform, and package consumers should be free to install software from any platform**.

To install Crom, use npm:

```
npm install -g crom
```

(Yes, this part is slightly ironic. But it’s also practical!)

Next, to install a package, say [d3-format](https://github.com/d3/d3-format):

```
crom install d3-format
```

You can specify just a package name, or a user name and package name together. So this works, too, and is useful for disambiguating:

```
crom install d3/d3-format
```

Once Crom finds a matching repository, it looks for the latest release that satisfies the semantic version range you specify. (If you don’t specify a version, it uses the `*` range.) For example, to install d3-format version 0.5, which currently maps to the tag [v0.5.0](https://github.com/d3/d3-format/releases/tag/v0.5.0):

```
crom install d3-format@0.5
```

If Crom finds a satisfying release, it doesn’t clone the Git repository. Instead, it looks for a ZIP file attached to your release, and downloads that. So you can put whatever you want inside that ZIP file—namely, generated files—and those will be installed.

Crom extracts the ZIP file into a `crom_modules` folder, creating a subfolder for each package. So the above results in the following file structure:

```
crom_modules
└─┬ d3-format
  ├── LICENSE
  ├── README.md
  ├── d3-format.js
  └── d3-format.min.js
```

And that’s it.

Crom doesn’t currently understand package metadata, so it won’t (yet) help you load packages (e.g., using `require`). And it doesn’t understand dependencies (again, yet), so it’s won’t download anything other than the package you specify on the command-line. And Crom doesn’t record what you’ve installed, either, so you can’t install a bunch of things and keep them updated, or whatever.

Those features can all be added in the future, most likely by adapting the venerable [package.json format](https://docs.npmjs.com/files/package.json) (though perhaps using URLs instead of names).
