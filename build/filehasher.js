var hashed_file_path = {};
(function (console, args, readFileFunc) {
  env = 'node';
  var fs,vm,path, build,fileName, hashlib,
  empty = {},
  readFile = typeof readFileFunc !== 'undefined' ? readFileFunc : null,
  fileName;
  fs = require('fs');
  vm = require('vm');
  hashlib = require('crypto');
  path = require('path');

  fileName = process.argv[2];

  if (fileName && fileName.indexOf('-') === 0) {
    commandOption = fileName.substring(1);
    fileName = process.argv[3];
  }

  function mkDir(dir) {
    if (!path.existsSync(dir)) {
      fs.mkdirSync(dir, 0777);
    }
  }

  function mkFullDir(dir) {
    var parts = dir.split('/'),
    currDir = '',
    first = true;
    parts.forEach(function (part) {
      //First part may be empty string if path starts with a slash.
      currDir += part + '/';
      first = false;

      if (part) {
	mkDir(currDir);
      }
    });
  }

  var file = {
    backSlashRegExp: /\\/g,
    getLineSeparator: function () {
      return '/';
    },

    exists: function (fileName) {
      return path.existsSync(fileName);
    },

    parent: function (fileName) {
      var parts = fileName.split('/');
      parts.pop();
      return parts.join('/');
    },

    /**
    * Gets the absolute file path as a string, normalized
    * to using front slashes for path separators.
    * @param {String} fileName
    */
    absPath: function (fileName) {
      return path.normalize(fs.realpathSync(fileName).replace(/\\/g, '/'));
    },

    normalize: function (fileName) {
      return path.normalize(fileName);
    },

    isFile: function (path) {
      return fs.statSync(path).isFile();
    },

    isDirectory: function (path) {
      return fs.statSync(path).isDirectory();
    },

    copyDir: function (/*String*/srcDir, /*String*/destDir, /*RegExp?*/regExpFilter, /*boolean?*/onlyCopyNew) {
      //summary: copies files from srcDir to destDir using the regExpFilter to determine if the
      //file should be copied. Returns a list file name strings of the destinations that were copied.
      regExpFilter = regExpFilter || /\w/;

      var fileNames = file.getFilteredFileList(srcDir, regExpFilter, true),
      copiedFiles = [], i, srcFileName, destFileName;

      for (i = 0; i < fileNames.length; i++) {
	srcFileName = fileNames[i];
	destFileName = srcFileName.replace(srcDir, destDir);

	if (file.copyFile(srcFileName, destFileName, onlyCopyNew)) {
	  copiedFiles.push(destFileName);
	}
      }

      return copiedFiles.length ? copiedFiles : null; //Array or null
    },

    copyFile: function (/*String*/srcFileName, /*String*/destFileName, /*boolean?*/onlyCopyNew) {
      //summary: copies srcFileName to destFileName. If onlyCopyNew is set, it only copies the file if
      //srcFileName is newer than destFileName. Returns a boolean indicating if the copy occurred.
      var parentDir;

      //logger.trace("Src filename: " + srcFileName);
      //logger.trace("Dest filename: " + destFileName);

      //If onlyCopyNew is true, then compare dates and only copy if the src is newer
      //than dest.
      if (onlyCopyNew) {
	if (path.existsSync(destFileName) && fs.statSync(destFileName).mtime.getTime() >= fs.statSync(srcFileName).mtime.getTime()) {
	  return false; //Boolean
	}
      }

      //Make sure destination dir exists.
      parentDir = path.dirname(destFileName);
      if (!path.existsSync(parentDir)) {
	mkFullDir(parentDir);
      }

      fs.writeFileSync(destFileName, fs.readFileSync(srcFileName, 'binary'), 'binary');
      return true; //Boolean
    },

    /**
    * Reads a *text* file.
    */
    readFile: function (/*String*/path, /*String?*/encoding) {
      if (encoding === 'utf-8') {
	encoding = 'utf8';
      }
      if (!encoding) {
	encoding = 'utf8';
      }

      return fs.readFileSync(path, encoding);
    },

    saveUtf8File: function (/*String*/fileName, /*String*/fileContents) {
      //summary: saves a *text* file using UTF-8 encoding.
      file.saveFile(fileName, fileContents, "utf8");
    },

    appendToFile: function (/*String*/fileName, /*String*/fileContents) {
      fs.open(fileName, "a", 0755, function (err, fd) {
	  if (err) throw err;
	  fs.write(fd, fileContents, null, 'utf8', function (err, written) {
	      if (err) throw err;
	  });
      });
    },

    saveFile: function (/*String*/fileName, /*String*/fileContents, /*String?*/encoding) {
      //summary: saves a *text* file.
      var parentDir;

      if (encoding === 'utf-8') {
	encoding = 'utf8';
      }
      if (!encoding) {
	encoding = 'utf8';
      }

      //Make sure destination directories exist.
      parentDir = path.dirname(fileName);
      if (!path.existsSync(parentDir)) {
	mkFullDir(parentDir);
      }

      fs.writeFileSync(fileName, fileContents, encoding);
    },

    deleteFile: function (/*String*/fileName) {
      //summary: deletes a file or directory if it exists.
      var files, i, stat;
      if (path.existsSync(fileName)) {
	stat = fs.statSync(fileName);
	if (stat.isDirectory()) {
	  files = fs.readdirSync(fileName);
	  for (i = 0; i < files.length; i++) {
	    this.deleteFile(path.join(fileName, files[i]));
	  }
	  fs.rmdirSync(fileName);
	} else {
	  fs.unlinkSync(fileName);
	}
      }
    }
  };


  build = function (cmdConfig) {
    var paths, config;


    /**
    * Simple function to mix in properties from source into target,
    * but only if target does not already have a property of the same name.
    * This is not robust in IE for transferring methods that match
    * Object.prototype names, but the uses of mixin here seem unlikely to
    * trigger a problem related to that.
    */
    build.mixin = function mixin(target, source, force) {
      for (var prop in source) {
	if (!(prop in empty) && (!(prop in target) || force)) {
	  target[prop] = source[prop];
	}
      }
    }

    /**
    * Creates a config object for an optimization build.
    * It will also read the build profile if it is available, to create
    * the configuration.
    *
    * @param {Object} cfg config options that take priority
    * over defaults and ones in the build file. These options could
    * be from a command line, for instance.
    *
    * @param {Object} the created config object.
    */
    build.createConfig = function (cfg) {
      /*jslint evil: true */
      var config = {}, 
      paths;


      if (cfg) {
	//A build file exists, load it to get more config.
	buildFile = file.absPath(cfg);

	//Find the build file, and make sure it exists, if this is a build
	//that has a build profile, and not just command line args with an in=path
	if (!file.exists(buildFile)) {
	  throw new Error("ERROR: build file does not exist: " + buildFile);
	}

	absFilePath = config.baseUrl = file.absPath(file.parent(buildFile));
	config.dir = config.baseUrl + "/build/";

	//Load build file options.
	buildFileContents = file.readFile(buildFile);

	try {
	  buildFileConfig = eval("(" + buildFileContents + ")");
	} catch (e) {
	  throw new Error("Build file " + buildFile + " is malformed: " + e);
	}
	build.mixin(config, buildFileConfig, true);

	//Re-apply the override config values, things like command line
	//args should take precedence over build file values.
	build.mixin(config, cfg, true);
      } else {
	console.log("Build file missing");
      }
      return config;
    };

    config = build.createConfig(fileName);
    paths = config.paths;
    var prop;
    for (prop in paths){
      if (paths.hasOwnProperty(prop)) {
	var srcPath;
	// the path provided thru app.build.js
	srcPath = paths[prop];
	// Get the js root path
	absFilePathDir = config.baseUrl = file.absPath(file.parent(paths[prop])); 
	// Get path where the files is compressed
	var compressedPath = absFilePathDir + '/' + config.dir + "/" + srcPath + '.js';
	//Build the hash
	var hash = hashlib.createHash('md5').update(file.readFile(compressedPath)).digest("hex");
	// created the hash path e.g. recipe_876sjkhsknjhnj4365.js
	var newHashedFormat = srcPath + "_" + hash; 
	var hashedFile = config.baseUrl = file.absPath(file.parent(paths[prop])) + '/' + newHashedFormat + '.js';
	file.copyFile(compressedPath, hashedFile);
	paths[prop] = newHashedFormat;
      }
    }
    hashed_file_path['hashed_file_path'] = paths;
    //append path to require.js so that it will be loaded with along
    file.appendToFile('require.js',"hashed_file_path = "+JSON.stringify(paths)+";");
  };

  build(args);
}((typeof console !== 'undefined' ? console : undefined),
(typeof Packages !== 'undefined' ? Array.prototype.slice.call(arguments, 0) : []),
(typeof readFile !== 'undefined' ? readFile : undefined)));
