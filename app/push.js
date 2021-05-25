import { find, getOne } from "@shoutem/redux-io";
import { hasModalOpen, navigateTo, openInModal } from "shoutem.navigation";

import { authenticate } from "shoutem.auth";

const PLACES_SCHEMA = "shoutem.places.places";
const PLACE_DETAILS_SCREEN = "shoutem.places.PlaceDetails";

const NAVIGABLE_SCHEMAS = {
  "shoutem.places.places": PLACES_SCHEMA,
};

function resolveNavigationAction(store, place) {
  const state = store.getState();

  const alreadyHasModalOpen = hasModalOpen(state);
  const navigatorFunc = alreadyHasModalOpen ? navigateTo : openInModal;

  const route = {
    screen: PLACE_DETAILS_SCREEN,
    props: { place },
  };
  const navigationAction = authenticate(() =>
    store.dispatch(navigatorFunc(route))
  );

  return store.dispatch(navigationAction);
}

// Handles opens for Shoutem deep linking of the form:
//
// {
//     "action": {
//             "type": "shoutem.application.EXECUTE_SHORTCUT",
//         "navigationAction": "shoutem.navigation.OPEN_MODAL",
//        "itemId": "<placeId>",
//             "itemSchema": "shoutem.places.places",
//          "source": "kumulos"
//  }
// }
//
// Currently only the Places module is supported
function handlePushOpen(store, notification) {
  const data = notification.data;
  const action = data ? data.action : undefined;

  if (!action) {
    return;
  }

  const schema = NAVIGABLE_SCHEMAS[action.itemSchema];

  if (!schema) {
    return;
  }

  store
    .dispatch(
      find(schema, undefined, {
        query: { "filter[id]": action.itemId },
      })
    )
    .then(() => {
      const place = getOne(action.itemId, store.getState(), schema);
      resolveNavigationAction(store, place);
    })
    .catch((e) => console.error(e));
}

export function createPushOpenedHandler(store) {
  return handlePushOpen.bind(null, store);
}
