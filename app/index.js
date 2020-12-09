import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

import Kumulos from "kumulos-react-native";
import { ext } from "./const";
import { getExtensionSettings } from "shoutem.application";

const ANDROID_BG_LOCATION_PERM =
  "android.permission.ACCESS_BACKGROUND_LOCATION";

// Constants `screens` (from extension.js) and `reducer` (from index.js)
// are exported via named export
// It is important to use those exact names

// export everything from extension.js
export * from "./extension";

// list of exports supported by shoutem can be found here: https://shoutem.github.io/docs/extensions/reference/extension-exports

function empty(v) {
  return !v || !v.length;
}

export function appDidFinishLaunching(app) {
  const store = app.getStore();
  const state = store.getState();
  const settings = getExtensionSettings(state, ext());

  if (!settings || empty(settings.apiKey) || empty(settings.secretKey)) {
    console.warn(
      "No Kumulos API key or secret key configured, skipping initialization!"
    );
    return;
  }

  Kumulos.initialize({
    apiKey: settings.apiKey,
    secretKey: settings.secretKey,
  });

  if ("android" === Platform.OS) {
    setupLocationTrackingAndroid();
  }
}

async function setupLocationTrackingAndroid() {
  const hasBasicLocationPerm = await requestLocationPerm(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  if (!hasBasicLocationPerm) {
    requestLocationSettings();
    return;
  }

  if (Platform.Version < 29) {
    NativeModules.KumulosShoutem.startLocationTracking();
    return;
  }

  let backgroundGranted = await PermissionsAndroid.check(
    ANDROID_BG_LOCATION_PERM
  );

  if (!backgroundGranted && Platform.Version === 29) {
    backgroundGranted = await requestLocationPerm(ANDROID_BG_LOCATION_PERM);
  }

  if (!backgroundGranted) {
    requestLocationSettings();
  } else {
    NativeModules.KumulosShoutem.startLocationTracking();
  }
}

async function requestLocationPerm(perm) {
  let result;
  try {
    result = await PermissionsAndroid.request(perm, {
      title: "Location-based Content",
      message:
        "This app would like to use your location to enable relevant content and functionality",
    });
  } catch (e) {
    console.error(e);
    return false;
  }

  return PermissionsAndroid.RESULTS.GRANTED === result;
}

async function onAppStateChanged(state) {
  if ("active" !== state) {
    return;
  }

  let perm = ANDROID_BG_LOCATION_PERM;
  if (Platform.Version < 29) {
    perm = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  }

  const granted = await PermissionsAndroid.check(perm);

  if (!granted) {
    return;
  }

  NativeModules.KumulosShoutem.startLocationTracking();
  AppState.removeEventListener("change", onAppStateChanged);
}

function requestLocationSettings() {
  AppState.addEventListener("change", onAppStateChanged);

  Alert.alert(
    "Location-based Content",
    "Please allow location access all the time in the app's settings to enable relevant content and functionality",
    [
      {
        text: "Maybe Later",
        style: "cancel",
      },
      {
        text: "Open Settings",
        onPress: () => Linking.openSettings(),
      },
    ],
    { cancelable: false }
  );
}
