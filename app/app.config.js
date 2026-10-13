// Extiende app.json. `google-services.json` no se versiona (lleva claves de Firebase): en local se lee
// del archivo y en EAS Build de la variable de tipo archivo GOOGLE_SERVICES_JSON (`eas env:create`).
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
