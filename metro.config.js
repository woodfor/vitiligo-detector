// Get the default Metro configuration from Expo
const { getDefaultConfig } = require('expo/metro-config');

// Get the default config
const config = getDefaultConfig(__dirname);

// Add 'tflite' to the list of asset extensions.
config.resolver.assetExts.push('tflite');

// Export the modified config.
module.exports = config;
