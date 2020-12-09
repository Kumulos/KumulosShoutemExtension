import {
  Alert,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

import Kumulos from "kumulos-react-native";
import { ext } from "./const";
import { getExtensionSettings } from "shoutem.application";

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
  if (Platform.Version < 29) {
    requestLocationPermAndroid9Below();
  } else if (Platform.Version === 29) {
    requestLocationPermAndroid10();
  } else {
    requestLocationPermAndroid11Plus();
  }
}

async function requestLocationPermAndroid() {
  let result;
  try {
    result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location-based Content",
        message:
          "This app would like to use your location to enable relevant content and functionality",
      }
    );
  } catch (e) {
    console.error(e);
    return false;
  }

  return PermissionsAndroid.RESULTS.GRANTED === result;
}

async function requestLocationPermAndroid9Below() {
  const granted = await requestLocationPermAndroid();

  if (granted) {
    NativeModules.KumulosShoutem.startLocationTracking();
  }
}

async function requestLocationPermAndroid10() {
  const granted = await requestLocationPermAndroid();

  if (!granted) {
    return;
  }

  let result;
  try {
    result = await PermissionsAndroid.request(
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      {
        title: "Location-based Content",
        message:
          "This app would like to use your location to enable relevant content and functionality",
      }
    );
  } catch (e) {
    console.error(e);
    return;
  }

  if (PermissionsAndroid.RESULTS.GRANTED !== result) {
    return;
  }

  NativeModules.KumulosShoutem.startLocationTracking();
}

async function requestLocationPermAndroid11Plus() {
  await requestLocationPermAndroid();

  const backgroundGranted = await PermissionsAndroid.check(
    "android.permission.ACCESS_BACKGROUND_LOCATION"
  );

  if (!backgroundGranted) {
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
  } else {
    NativeModules.KumulosShoutem.startLocationTracking();
  }
}
