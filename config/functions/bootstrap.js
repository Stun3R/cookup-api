'use strict';

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/3.0.0-beta.x/configurations/configurations.html#bootstrap
 */

require('dotenv').config({ path: require('find-config')('.env') }); // pass variables from .env file to process.env
const _ = require('lodash');
const setupGrantConfig = require('./setupGrantConfig');

module.exports = async () => {
  await setupGrantConfig(strapi);
};
