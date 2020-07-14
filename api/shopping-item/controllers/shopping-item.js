'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');

module.exports = {
  async buy(ctx) {
    const { id } = ctx.params;
    const { quantity } = ctx.request.body;

    const entity = await strapi.services['shopping-item'].update({ id }, { bought: true });

    if (entity && quantity && quantity >= entity.food.quantity) {
      const food = await strapi.services.food.update({ id: entity.food.id }, { quantity: parseFloat(quantity) });
      if (food) {
        entity.food = food;
      }
    }

    return sanitizeEntity(entity, { model: strapi.models['shopping-item'] });
  },
};