import { PLACES_SCHEMA, PLACE_DETAILS_SCREEN } from "shoutem.places";
import { hasModalOpen, navigateTo, openInModal } from "shoutem.navigation";

import { find } from "@shoutem/redux-io";

const NAVIGABLE_SCHEMAS = {
  "shoutem.places.places": PLACES_SCHEMA,
};

function resolveNavigationAction(store, place) {
  console.log("Resolving navigation for place");
  console.log(place);
  const route = {
    screen: PLACE_DETAILS_SCREEN,
    props: { place },
  };
  const state = store.getState();
  const alreadyHasModalOpen = hasModalOpen(state);
  const navigationAction = alreadyHasModalOpen ? navigateTo : openInModal;
  return navigationAction(route);
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
  console.log("Opened notification =======================");
  console.log(notification);
  const data = notification.data;
  const action = data ? data.action : undefined;

  if (!action) {
    console.log("No action, abort");
    return;
  }

  const schema = NAVIGABLE_SCHEMAS[action.itemSchema];

  if (!schema) {
    console.log("No schema, abort");
    return;
  }

  store
    .dispatch(
      find(schema, undefined, {
        query: { "filter[id]": action.itemId },
      })
    )
    .then(({ payload: { data } }) => {
      resolveNavigationAction(store, data[0]);
    })
    .catch((e) => console.error(e));
}

export function createPushOpenedHandler(store) {
  return handlePushOpen.bind(null, store);
}
