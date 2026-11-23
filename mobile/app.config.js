/**
 * Expo config dinamico.
 * - GOOGLE_SERVICES_JSON: arquivo secret no EAS (fora do git).
 */
const appJson = require("./app.json");

module.exports = () => {
  const expo = appJson.expo;

  return {
    ...expo,
    android: {
      ...expo.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },
    extra: {
      ...expo.extra,
    },
  };
};
