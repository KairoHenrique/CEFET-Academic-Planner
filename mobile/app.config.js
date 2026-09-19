/**
 * Expo config dinamico.
 * - GOOGLE_SERVICES_JSON: arquivo secret no EAS (fora do git).
 * - ADMOB_*: IDs de producao no EAS (secrets/env). Sem eles, usa IDs de teste Google.
 */
const appJson = require("./app.json");

const TEST_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const TEST_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

function envTrim(name) {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

module.exports = () => {
  const expo = appJson.expo;
  const androidAppId = envTrim("ADMOB_ANDROID_APP_ID") || TEST_ANDROID_APP_ID;
  const appOpenUnitId = envTrim("ADMOB_APP_OPEN_UNIT_ID");
  const interstitialUnitId = envTrim("ADMOB_INTERSTITIAL_UNIT_ID");

  const plugins = (expo.plugins || []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== "react-native-google-mobile-ads") {
      return plugin;
    }
    return [
      "react-native-google-mobile-ads",
      {
        ...(plugin[1] || {}),
        androidAppId,
        iosAppId: envTrim("ADMOB_IOS_APP_ID") || TEST_IOS_APP_ID,
      },
    ];
  });

  return {
    ...expo,
    android: {
      ...expo.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },
    plugins,
    extra: {
      ...expo.extra,
      admobEnabled: expo.extra?.admobEnabled !== false,
      admobAppOpenUnitId: appOpenUnitId || expo.extra?.admobAppOpenUnitId || "",
      admobInterstitialUnitId:
        interstitialUnitId || expo.extra?.admobInterstitialUnitId || "",
    },
  };
};
