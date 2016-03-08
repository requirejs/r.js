//Helper functions to deal with file I/O.

/*jslint plusplus: false */
/*global define, Components, xpcUtil */

define(['prim'], function (prim) {
    var file,
        Cc = Components.classes,
        Ci = Components.interfaces,
        //Depends on xpcUtil which is set up in x.js
        xpfile = xpcUtil.xpfile;

    function mkFullDir(dirObj) {
        //1 is DIRECTORY_TYPE, 511 is 0777 permissions
        if (!dirObj.exists()) {
            dirObj.create(1, 511);
        }
    }

    file = {
        backSlashRegExp: /\\/g,

        exclusionRegExp: /^\./,

        getLineSeparator: function () {
            return file.lineSeparator;
        },

        lineSeparator: ('@mozilla.org/windows-registry-key;1' in Cc) ?
                        '\r\n' : '\n',

        exists: function (fileName) {
            return xpfile(fileName).exists();
        },

        parent: function (fileName) {
            return xpfile(fileName).parent;
        },

        normalize: function (fileName) {
            return file.absPath(fileName);
        },

        isFile: function (path) {
            return xpfile(path).isFile();
        },

        isDirectory: function (path) {
            return xpfile(path).isDirectory();
        },

        /**
         * Gets the absolute file path as a string, normalized
         * to using front slashes for path separators.
         * @param {java.io.File||String} file
         */
        absPath: function (fileObj) {
            if (typeof fileObj === "string") {
                fileObj = xpfile(fileObj);
            }
            return fileObj.path;
        },

        getFilteredFileList: function (/*String*/startDir, /*RegExp*/regExpFilters, /*boolean?*/makeUnixPaths, /*boolean?*/startDirIsObject) {
            //summary: Recurses startDir and finds matches to the files that match regExpFilters.include
            //and do not match regExpFilters.exclude. Or just one regexp can be passed in for regExpFilters,
            //and it will be treated as the "include" case.
            //Ignores files/directories that start with a period (.) unless exclusionRegExp
            //is set to another value.
            var files = [], topDir, regExpInclude, regExpExclude, dirFileArray,
                fileObj, filePath, ok, dirFiles;

            topDir = startDir;
            if (!startDirIsObject) {
                topDir = xpfile(startDir);
            }

            regExpInclude = regExpFilters.include || regExpFilters;
            regExpExclude = regExpFilters.exclude || null;

            if (topDir.exists()) {
                dirFileArray = topDir.directoryEntries;
                while (dirFileArray.hasMoreElements()) {
                    fileObj = dirFileArray.getNext().QueryInterface(Ci.nsILocalFile);
                    if (fileObj.isFile()) {
                        filePath = fileObj.path;
                        if (makeUnixPaths) {
                            if (filePath.indexOf("/") === -1) {
                                filePath = filePath.replace(/\\/g, "/");
                            }
                        }

                        ok = true;
                        if (regExpInclude) {
                            ok = filePath.match(regExpInclude);
                        }
                        if (ok && regExpExclude) {
                            ok = !filePath.match(regExpExclude);
                        }

                        if (ok && (!file.exclusionRegExp ||
                            !file.exclusionRegExp.test(fileObj.leafName))) {
                            files.push(filePath);
                        }
                    } else if (fileObj.isDirectory() &&
                              (!file.exclusionRegExp || !file.exclusionRegExp.test(fileObj.leafName))) {
                        dirFiles = this.getFilteredFileList(fileObj, regExpFilters, makeUnixPaths, true);
                        files.push.apply(files, dirFiles);
                    }
                }
            }

            return files; //Array
        },

        copyDir: function (/*String*/srcDir, /*String*/destDir, /*RegExp?*/regExpFilter, /*boolean?*/onlyCopyNew) {
            //summary: copies files from srcDir to destDir using the regExpFilter to determine if the
            //file should be copied. Returns a list file name strings of the destinations that were copied.
            regExpFilter = regExpFilter || /\w/;

            var fileNames = file.getFilteredFileList(srcDir, regExpFilter, true),
            copiedFiles = [], i, srcFileName, destFileName;

            for (i = 0; i < fileNames.length; i += 1) {
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
            var destFile = xpfile(destFileName),
            srcFile = xpfile(srcFileName);

            //logger.trace("Src filename: " + srcFileName);
            //logger.trace("Dest filename: " + destFileName);

            //If onlyCopyNew is true, then compare dates and only copy if the src is newer
            //than dest.
            if (onlyCopyNew) {
                if (destFile.exists() && destFile.lastModifiedTime >= srcFile.lastModifiedTime) {
                    return false; //Boolean
                }
            }

            srcFile.copyTo(destFile.parent, destFile.leafName);

            return true; //Boolean
        },

        /**
         * Renames a file. May fail if "to" already exists or is on another drive.
         */
        renameFile: function (from, to) {
            var toFile = xpfile(to);
            return xpfile(from).moveTo(toFile.parent, toFile.leafName);
        },

        readFile: xpcUtil.readFile,

        readFileAsync: function (path, encoding) {
            var d = prim();
            try {
                d.resolve(file.readFile(path, encoding));
            } catch (e) {
                d.reject(e);
            }
            return d.promise;
        },

        saveUtf8File: function (/*String*/fileName, /*String*/fileContents) {
            //summary: saves a file using UTF-8 encoding.
            file.saveFile(fileName, fileContents, "utf-8");
        },

        saveFile: function (/*String*/fileName, /*String*/fileContents, /*String?*/encoding) {
            var outStream, convertStream,
                fileObj = xpfile(fileName);

            mkFullDir(fileObj.parent);

            try {
                outStream = Cc['@mozilla.org/network/file-output-stream;1']
                             .createInstance(Ci.nsIFileOutputStream);
                //438 is decimal for 0777
                outStream.init(fileObj, 0x02 | 0x08 | 0x20, 511, 0);

                convertStream = Cc['@mozilla.org/intl/converter-output-stream;1']
                                  .createInstance(Ci.nsIConverterOutputStream);

                convertStream.init(outStream, encoding, 0, 0);
                convertStream.writeString(fileContents);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            } finally {
                if (convertStream) {
                    convertStream.close();
                }
                if (outStream) {
                    outStream.close();
                }
            }
        },

        deleteFile: function (/*String*/fileName) {
            //summary: deletes a file or directory if it exists.
            var fileObj = xpfile(fileName);
            if (fileObj.exists()) {
                fileObj.remove(true);
            }
        },

        /**
         * Deletes any empty directories under the given directory.
         * The startDirIsJavaObject is private to this implementation's
         * recursion needs.
         */
        deleteEmptyDirs: function (startDir, startDirIsObject) {
            var topDir = startDir,
                dirFileArray, fileObj;

            if (!startDirIsObject) {
                topDir = xpfile(startDir);
            }

            if (topDir.exists()) {
                dirFileArray = topDir.directoryEntries;
                while (dirFileArray.hasMoreElements()) {
                    fileObj = dirFileArray.getNext().QueryInterface(Ci.nsILocalFile);

                    if (fileObj.isDirectory()) {
                        file.deleteEmptyDirs(fileObj, true);
                    }
                }

                //If the directory is empty now, delete it.
                dirFileArray = topDir.directoryEntries;
                if (!dirFileArray.hasMoreElements()) {
                    file.deleteFile(topDir.path);
                }
            }
        }
    };

    return file;
});
