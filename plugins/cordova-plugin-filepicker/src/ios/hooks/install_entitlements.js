// using error to see if this shows up in AB
console.error("Running hook to add iCloud entitlements");

var fs = require('fs'),
    path = require('path');

module.exports = function (context) {
  var xcode = context.requireCordovaModule('xcode');
  var Q = context.requireCordovaModule('q');
  var deferral = new Q.defer();

  if (context.opts.cordova.platforms.indexOf('ios') < 0) {
    throw new Error('This plugin expects the ios platform to exist.');
  }

  var iosFolder = context.opts.cordova.project ? context.opts.cordova.project.root : path.join(context.opts.projectRoot, 'platforms/ios/');
  console.error("iosFolder: " + iosFolder);

  fs.readdir(iosFolder, function (err, data) {
    if (err) {
      throw err;
    }

    var projFolder;
    var projName;

    // Find the project folder by looking for *.xcodeproj
    if (data && data.length) {
      data.forEach(function (folder) {
        if (folder.match(/\.xcodeproj$/)) {
          projFolder = path.join(iosFolder, folder);
          projName = path.basename(folder, '.xcodeproj');
        }
      });
    }

    if (!projFolder || !projName) {
      throw new Error("Could not find an .xcodeproj folder in: " + iosFolder);
    }

    var destFile = path.join(iosFolder, projName, 'Resources', projName + '.entitlements');
    if (fs.existsSync(destFile)) {
      console.error("File exists, not doing anything: " + destFile);
    } else {
      var sourceFile = path.join(context.opts.plugin.pluginInfo.dir, 'src/ios/resources/iCloud.entitlements');
      fs.readFile(sourceFile, 'utf8', function (err, data) {
        var resourcesFolderPath = path.join(iosFolder, projName, 'Resources');
        fs.existsSync(resourcesFolderPath) || fs.mkdirSync(resourcesFolderPath);
        fs.writeFileSync(destFile, data);

        var projectPath = path.join(projFolder, 'project.pbxproj');

        var pbxProject;
        if (context.opts.cordova.project) {
          pbxProject = context.opts.cordova.project.parseProjectFile(context.opts.projectRoot).xcode;
        } else {
          pbxProject = xcode.project(projectPath);
          pbxProject.parseSync();
        }

        pbxProject.addResourceFile(projName + ".entitlements");

        var configGroups = pbxProject.hash.project.objects['XCBuildConfiguration'];
        for (var key in configGroups) {
          var config = configGroups[key];
          if (config.buildSettings !== undefined) {
            config.buildSettings.CODE_SIGN_ENTITLEMENTS = '"' + projName + '/Resources/' + projName + '.entitlements"';
          }
        }

        // write the updated project file
        fs.writeFileSync(projectPath, pbxProject.writeSync());
        console.error("Added iCloud entitlements to project '" + projName + "'");

        deferral.resolve();
      });
    }
  });

  return deferral.promise;
};
