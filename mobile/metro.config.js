const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const contractsRoot = path.resolve(projectRoot, "../packages/api-contracts");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo: observa o pacote de contratos (M2) sem quebrar resolução do Expo.
config.watchFolders = [...(config.watchFolders ?? []), contractsRoot];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "@acme/api-contracts": contractsRoot,
};

module.exports = config;
