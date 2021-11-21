// const extraNodeModules = require('node-libs-browser');

// module.exports = {
//   resolver: {
//     extraNodeModules
//   },
//   transformer: {
//     assetPlugins: ['expo-asset/tools/hashAssetFiles']
//   },
// };

const extraNodeModules = require('node-libs-browser');
const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts } 
  } = await getDefaultConfig();
  return {
    transformer: {
      assetPlugins: ['expo-asset/tools/hashAssetFiles'],
      babelTransformerPath: require.resolve("react-native-svg-transformer")
    },
    resolver: {
      extraNodeModules,
      assetExts: assetExts.filter(ext => ext !== "svg"),
      sourceExts: [...sourceExts, "svg"]
    }
  };
})();