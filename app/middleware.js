import { LOGIN, LOGOUT, REGISTER, getUser } from "shoutem.auth";
import { before, priorities, setPriority } from "shoutem-core";

import Kumulos from "kumulos-react-native";
import { associateUser } from "./utils";

export const initMiddleware = setPriority(
  (store) => (next) => async (action) => {
    if (action.type === LOGIN || action.type === REGISTER) {
      const state = store.getState();
      const user = getUser(state);

      associateUser(user);
    }

    return next(action);
  },
  priorities.AUTH
);

export const logoutMiddleware = setPriority(
  () => (next) => async (action) => {
    if (action.type === LOGOUT) {
      Kumulos.clearUserAssociation();
    }

    return next(action);
  },
  before(priorities.AUTH)
);
