const {
  reactNativeLink,
  getXcodeProjectPath
} = require("@shoutem/build-tools");

const xcode = require("xcode");
const fs = require("fs");

const { injectKumulos } = require("./inject");

reactNativeLink("kumulos-react-native");

const xcodeprojPath = getXcodeProjectPath();
const xcodeProject = xcode.project(xcodeprojPath).parseSync();

// Set up SWIFT_VERSION to allow depending on SocketIO client pod
xcodeProject.addToBuildSettings("SWIFT_VERSION", "4.2");
fs.writeFileSync(xcodeprojPath, xcodeProject.writeSync());

injectKumulos();
