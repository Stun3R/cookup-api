'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services['daily-menu'].search(ctx.query, ['breakfast.recipes.ingredients', 'lunch.recipes.ingredients', 'dinner.recipes.ingredients']);
    } else {
      entities = await strapi.services['daily-menu'].find(ctx.query, ['breakfast.recipes.ingredients', 'lunch.recipes.ingredients', 'dinner.recipes.ingredients']);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models['daily-menu'] }));
  },
};

