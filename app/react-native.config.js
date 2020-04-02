module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: "android"
      }
    },
    hooks: {
      postlink: "node node_modules/kumulos.kumulos/scripts/postlink.js"
    }
  }
};
