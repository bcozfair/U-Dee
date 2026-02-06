const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    util: require.resolve("util"),
    assert: require.resolve("assert"),
};

module.exports = config;
