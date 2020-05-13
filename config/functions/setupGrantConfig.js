const _ = require('lodash');
const utils = require('./utils');

module.exports = async () => {
  const pluginStore = strapi.store({
    environment: '',
    type: 'plugin',
    name: 'users-permissions',
  });

  const { currentEnvironment } = strapi.config;
  const grantConfig = await pluginStore.get({ key: 'grant' });

  // set key, secret & callbacks for each provider
  _.keys(grantConfig).forEach((key) => {
    if (_.has(grantConfig[key], 'callback')) {
      // The redirect URL to your front-end app 
      // e.g. http://yourproject.com/auth/callback/facebook
      // you can set your custom url 🤷‍♂️
      grantConfig[key].callback = `${currentEnvironment.frontendURL}auth/${key}`;
      // The redirect URL to add in your provider application configurations
      // e.g. http://yourstrapiapp.com/connect/facebook/callback
      if (utils.isProduction) {
        grantConfig[key].redirect_uri = `${currentEnvironment.backendURL}connect/${key}/callback`;
      }
    }
  });

  await pluginStore.set({ key: 'grant', value: grantConfig });
};