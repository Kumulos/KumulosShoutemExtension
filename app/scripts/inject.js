const {
  getAppGradlePath,
  getMainApplicationPath,
  getAppDelegatePath,
  inject,
  replace,
  ANCHORS,
  projectPath,
} = require("@shoutem/build-tools");
const path = require("path");
const fs = require("fs");

const consts = require("./consts");
const { getKumulosSettings } = require("./config");

function empty(v) {
  return !v || !v.length;
}

function settingsValid(settings) {
  return settings && !empty(settings.apiKey) && !empty(settings.secretKey);
}

const { mergeKumulosPlist } = require("./plist-helper");

function injectIos() {
  const appDelegatePath = getAppDelegatePath({ cwd: projectPath });

  inject(
    appDelegatePath,
    ANCHORS.IOS.APP_DELEGATE.IMPORT,
    consts.ios.delegateImports
  );

  inject(
    appDelegatePath,
    ANCHORS.IOS.APP_DELEGATE.BODY,
    consts.ios.delegateBody
  );

  replace(
    appDelegatePath,
    consts.ios.findDelegateLine,
    consts.ios.replaceDelegateLine
  );

  const settings = getKumulosSettings();
  if (!settingsValid(settings)) {
    console.error("Kumulos settings not found, skipping iOS config");
    return;
  }

  // init code
  const apiKey = settings.apiKey || "";
  const secretKey = settings.secretKey || "";
  replace(
    appDelegatePath,
    consts.ios.findDidLaunch,
    `
  KSConfig *kumulosConfig = [KSConfig configWithAPIKey:@"${apiKey}" andSecretKey:@"${secretKey}"];
  [KumulosReactNative initializeWithConfig:kumulosConfig];
  [self setupLocationMonitoring:launchOptions];
  [Kumulos.shared pushRequestDeviceToken];

  return YES;
`
  );

  mergeKumulosPlist();
}

function injectAndroid() {
  const settings = getKumulosSettings();

  const rootGradlePath = path.join(projectPath, "android", "build.gradle");
  const appGradlePath = getAppGradlePath({ cwd: projectPath });
  const appPath = getMainApplicationPath({ cwd: projectPath });
  // Gradle tweaks
  inject(
    rootGradlePath,
    ANCHORS.ANDROID.GRADLE.ROOT_GRADLE,
    `
  classpath 'com.google.gms:google-services:3.0.0'
  `
  );
  inject(
    appGradlePath,
    ANCHORS.ANDROID.GRADLE.APP.ANDROID_END,
    `
    // Kumulos SDK start
    packagingOptions {
        exclude 'META-INF/NOTICE'
        exclude 'META-INF/ASL2.0'
        exclude 'META-INF/LICENSE'
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    // Kumulos SDK end
  `
  );
  inject(
    appGradlePath,
    ANCHORS.ANDROID.GRADLE.APP.DEPENDENCIES,
    `
    // Kumulos SDK start
    debugImplementation 'com.kumulos.android:kumulos-android-debug:9.0.0'
    releaseImplementation 'com.kumulos.android:kumulos-android-release:9.0.0'
    // Kumulos SDK end
  `
  );
  // imports
  inject(
    appPath,
    ANCHORS.ANDROID.MAIN_APPLICATION.IMPORT,
    `
import com.kumulos.android.KumulosConfig;
import com.kumulos.android.Kumulos;
import com.kumulos.reactnative.KumulosReactNative;
`
  );

  if (!settingsValid(settings) || empty(settings.fcmGoogleServicesJson)) {
    console.error("Kumulos settings not found, skipping Android config");
    return;
  }

  inject(
    appGradlePath,
    ANCHORS.ANDROID.GRADLE.APP.PLUGINS,
    `
    apply plugin: "com.google.gms.google-services"
  `
  );

  // init code
  const apiKey = settings.apiKey || "";
  const secretKey = settings.secretKey || "";
  inject(
    appPath,
    ANCHORS.ANDROID.MAIN_APPLICATION.ON_CREATE_END,
    `
KumulosConfig.Builder kCfgBuilder = new KumulosConfig.Builder("${apiKey}", "${secretKey}");
KumulosReactNative.initialize(this, kCfgBuilder);
Kumulos.pushRegister(this);
  `
  );

  writeGoogleServicesFile(settings);
}

function writeGoogleServicesFile(settings) {
  const androidAppDir = path.join(projectPath, "android", "app");
  const outFile = path.join(androidAppDir, "google-services.json");
  fs.writeFileSync(outFile, settings.fcmGoogleServicesJson);
}

function injectKumulos() {
  injectIos();
  injectAndroid();
}

module.exports = {
  injectKumulos,
};
