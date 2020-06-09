'use strict';

const _ = require('lodash');

module.exports = async () => {
  const pluginStore = strapi.store({
    environment: '',
    type: 'plugin',
    name: 'users-permissions',
  });

  const grantConfig = await pluginStore.get({ key: 'grant' });
  
  // set key, secret & callbacks for each provider
  _.keys(grantConfig).forEach((key) => {
    if (_.has(grantConfig[key], 'callback')) {
      // The redirect URL to your front-end app 
      // e.g. http://yourproject.com/auth/callback/facebook
      // you can set your custom url 🤷‍♂️
      grantConfig[key].callback = `${process.env.FRONTEND_URL}auth/provider/${key}`;
      // The redirect URL to add in your provider application configurations
      // e.g. http://yourstrapiapp.com/connect/facebook/callback
      if (strapi.config.environment === 'production') {
        grantConfig[key].redirect_uri = `${process.env.BACKEND_URL}connect/${key}/callback`;
      }
    }
  });
  console.log(grantConfig);
  await pluginStore.set({ key: 'grant', value: grantConfig });
};
