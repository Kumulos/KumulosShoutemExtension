import { associateUser, emptyString } from "./utils";
import { initMiddleware, logoutMiddleware } from "./middleware";

import Kumulos from "kumulos-react-native";
import { Platform } from "react-native";
import { ext } from "./const";
import { getExtensionSettings } from "shoutem.application";
import { getUser } from "shoutem.auth";
import { setupLocationTrackingAndroid } from "./location";

// Constants `screens` (from extension.js) and `reducer` (from index.js)
// are exported via named export
// It is important to use those exact names

// export everything from extension.js
export * from "./extension";

// list of exports supported by shoutem can be found here: https://shoutem.github.io/docs/extensions/reference/extension-exports

export const middleware = [initMiddleware, logoutMiddleware];

export function appDidFinishLaunching(app) {
  const store = app.getStore();
  const state = store.getState();
  const settings = getExtensionSettings(state, ext());

  if (
    !settings ||
    emptyString(settings.apiKey) ||
    emptyString(settings.secretKey)
  ) {
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

  const shoutemUser = getUser(state);
  associateUser(shoutemUser);
}
