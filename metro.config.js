const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const FileStore = require("metro-cache").FileStore;

const config = getDefaultConfig(__dirname);

// Use a local project directory for metro cache to avoid EPERM conflicts in Windows Temp
config.cacheStores = [
  new FileStore({
    root: path.join(__dirname, "node_modules/.cache/metro-cache"),
  }),
];

module.exports = withNativeWind(config, { input: "./src/global.css" });
