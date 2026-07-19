const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const contractsRoot = path.resolve(projectRoot, "../packages/api-contracts");
const svgCommonJs = path.resolve(
  projectRoot,
  "node_modules/react-native-svg/lib/commonjs/index.js"
);

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo: observa o pacote de contratos (M2) sem quebrar resolução do Expo.
config.watchFolders = [...(config.watchFolders ?? []), contractsRoot];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "@acme/api-contracts": contractsRoot,
};

/**
 * Expo aponta `"react-native": "src/index.ts"` no react-native-svg.
 * No Windows/OneDrive o Metro falha em `export * from './lib/extract/types'`.
 * Força o build CommonJS (já compilado) — evita UnableToResolveError.
 */
const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-svg") {
    return { type: "sourceFile", filePath: svgCommonJs };
  }
  if (typeof upstreamResolveRequest === "function") {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
