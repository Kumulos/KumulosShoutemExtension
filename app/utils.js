import Kumulos from "kumulos-react-native";

export function emptyString(v) {
  return !v || !v.length;
}

export function associateUser(user) {
  if (!user || emptyString(user.id)) {
    return;
  }

  const excludedUserKeys = ["profile"];
  const excludedProfileKeys = ["personalIdentificationNumber"];

  const attrs = { profile: {} };
  Object.keys(user)
    .filter((k) => excludedUserKeys.indexOf(k) === -1)
    .forEach((k) => (attrs[k] = user[k]));

  Object.keys(user.profile)
    .filter((k) => excludedProfileKeys.indexOf(k) === -1)
    .forEach((k) => (attrs.profile[k] = user.profile[k]));

  Kumulos.associateUserWithInstall(user.username, attrs);
}
