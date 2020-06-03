'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/models.html#life-cycle-callbacks)
 * to customize this model
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  lifecycles: {
    beforeCreate(data) {
      data.uuid = uuidv4();
    },
  },
};
