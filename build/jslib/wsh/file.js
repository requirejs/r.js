/**
 * @license RequireJS Copyright (c) 2013, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Helper functions to deal with file I/O.

/*global define, requirejsEnvUtil, Enumerator */

define(['prim'], function (prim) {
    var file,
        //Depends on requirejsEnvUtil which is set up in x.js
        //Defined via new ActiveXObject("Scripting.FileSystemObject")
        //http://msdn.microsoft.com/en-us/library/hww8txat%28v=vs.84%29.aspx
        fso = requirejsEnvUtil.fso;

    file = {
        backSlashRegExp: /\\/g,

        exclusionRegExp: /^\./,

        getLineSeparator: function () {
            return file.lineSeparator;
        },

        lineSeparator: '\r\n',

        exists: function (fileName) {
            return fso.FileExists(fileName) || fso.FolderExists(fileName);
        },

        parent: function (fileName) {
            return fso.GetParentFolderName(fileName);
        },

        normalize: function (fileName) {
            return file.absPath(fileName);
        },

        isFile: function (path) {
            return fso.FileExists(path);
        },

        isDirectory: function (path) {
            return fso.FolderExists(path);
        },

        /**
         * Gets the absolute file path as a string, normalized
         * to using front slashes for path separators.
         * @param {java.io.File||String} file
         */
        absPath: function (path) {
            return fso.GetAbsolutePathName(path).replace(/\\/g, '/');
        },

        getFilteredFileList: function (/*String*/startDir, /*RegExp*/regExpFilters, /*boolean?*/makeUnixPaths, /*boolean?*/startDirIsObject) {
            //summary: Recurses startDir and finds matches to the files that match regExpFilters.include
            //and do not match regExpFilters.exclude. Or just one regexp can be passed in for regExpFilters,
            //and it will be treated as the "include" case.
            //Ignores files/directories that start with a period (.) unless exclusionRegExp
            //is set to another value.
            var files = [], topDir, regExpInclude, regExpExclude,
                fileObj, filePath, ok, dirFiles, ne;

            topDir = startDir;
            if (!startDirIsObject) {
                topDir = fso.GetFolder(startDir);
            }

            regExpInclude = regExpFilters.include || regExpFilters;
            regExpExclude = regExpFilters.exclude || null;

            if (topDir.FolderExists()) {
                ne = new Enumerator(topDir.Files);

                //Files in the directory
                while (!ne.atEnd()) {
                    fileObj = ne.item();

                    filePath = fileObj.GetAbsolutePathName();
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
                        !file.exclusionRegExp.test(fileObj.GetFileName()))) {
                        files.push(filePath);
                    }

                    ne.moveNext();
                }

                //Folders in the directory
                ne = new Enumerator(topDir.SubFolders);
                while (!ne.atEnd()) {
                    fileObj = ne.item();

                    if (!file.exclusionRegExp ||
                            !file.exclusionRegExp.test(fileObj.GetFileName())) {
                        dirFiles = this.getFilteredFileList(fileObj, regExpFilters, makeUnixPaths, true);
                        files.push.apply(files, dirFiles);
                    }

                    ne.moveNext();
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
            var destFile = fso.GetFile(destFileName),
            srcFile = fso.GetFile(srcFileName);

            //If onlyCopyNew is true, then compare dates and only copy if the src is newer
            //than dest.
            if (onlyCopyNew) {
                if (destFile.FileExists() && destFile.DateLastModified >= srcFile.DateLastModified) {
                    return false; //Boolean
                }
            }

            srcFile.Copy(destFileName);

            return true; //Boolean
        },

        /**
         * Renames a file. May fail if "to" already exists or is on another drive.
         */
        renameFile: function (from, to) {
            fso.MoveFile(from, to);
        },

        readFile: requirejsEnvUtil.readFile,

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
            //tristate values explained here:
            //http://msdn.microsoft.com/en-us/library/314cz14s%28v=vs.84%29.aspx
            //-1 for unicode, -2 system default
            var tristate = !encoding || encoding === "utf-8" ? -1 : -2,
                handle;

            //2 is write permission
            handle = fso.OpenTextFile(fileName, 2, true, tristate);
            handle.Write(fileContents);
            handle.Close();
        },

        deleteFile: function (/*String*/fileName) {
            //summary: deletes a file or directory if it exists.
            if (fso.FileExists(fileName)) {
                fso.DeleteFile(fileName);
            } else if (fso.FolderExists(fileName)) {
                fso.DeleteFolder(fileName);
            }
        },

        /**
         * Deletes any empty directories under the given directory.
         * The startDirIsJavaObject is private to this implementation's
         * recursion needs.
         */
        deleteEmptyDirs: function (startDir, startDirIsObject) {
            var topDir = startDir,
                ne;

            if (!startDirIsObject) {
                topDir = fso.GetFolder(startDir);
            }

            if (topDir.FolderExists()) {
                //Folders in the directory
                ne = new Enumerator(topDir.SubFolders);
                while (!ne.atEnd()) {
                    file.deleteEmptyDirs(ne.item(), true);
                    ne.moveNext();
                }

                //If the directory is empty now, delete it.
                if (topDir.Files.Count === 0 && topDir.Folders.Count === 0) {
                    file.deleteFile(topDir.path);
                }
            }
        }
    };

    return file;
});
