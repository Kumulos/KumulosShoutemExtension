import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  PermissionsAndroid,
  Platform
} from "react-native";

const ANDROID_BG_LOCATION_PERM =
  "android.permission.ACCESS_BACKGROUND_LOCATION";
const LOCATION_RATIONALE = "This app collects location data to enable finding relevant places of interest nearby even when the app is closed or not in use.";

export async function setupLocationTrackingAndroid() {
  let hasBasicLocationPerm = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  let prominentDisclosureShown = false;

  if (!hasBasicLocationPerm) {
    await showProminentDisclosure();
    prominentDisclosureShown = true;

    hasBasicLocationPerm = await requestLocationPerm(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (!hasBasicLocationPerm) {
      requestLocationSettings();
      return;
    }
  }

  if (Platform.Version < 29) {
    NativeModules.KumulosShoutem.startLocationTracking();
    return;
  }

  let backgroundGranted = await PermissionsAndroid.check(
    ANDROID_BG_LOCATION_PERM
  );

  if (backgroundGranted) {
    NativeModules.KumulosShoutem.startLocationTracking();
    return;
  }

  if (Platform.Version === 29) {
    if (!prominentDisclosureShown) {
      await showProminentDisclosure();
    }

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
      message: LOCATION_RATIONALE
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
    "Please allow 'all the time' location access in the app's permissions settings to enable relevant content and functionality",
    [
      {
        text: "Maybe Later",
        style: "cancel"
      },
      {
        text: "Open Settings",
        onPress: () => Linking.openSettings()
      }
    ],
    { cancelable: false }
  );
}

function showProminentDisclosure() {
  return new Promise((resolve) => {
    Alert.alert(
      "Location-based Content",
      LOCATION_RATIONALE,
      [
        {
          text: "OK",
          onPress: () => resolve()
        }
      ],
      { cancelable: false }
    );
  });
}
