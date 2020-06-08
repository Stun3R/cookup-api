'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */
  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data.user = ctx.state.user.id;
      data.house = ctx.state.user.current_house;
      const { ingredients } = data;
      for (const ingredient of ingredients) {
        const result = await strapi.services['ingredient'].create({
          food: ingredient.food,
          quantity: parseFloat(ingredient.quantity)
        });
        ingredient.id = result.id;
      }
      entity = await strapi.services.recipe.create(data, { files });
    } else {
      const { ingredients } = ctx.request.body;
      for (const ingredient of ingredients) {
        const result = await strapi.services['ingredient'].create({
          food: ingredient.food,
          quantity: parseFloat(ingredient.quantity)
        });
        ingredient.id = result.id;
      }
      ctx.request.body.user = ctx.state.user.id;
      ctx.request.body.house = ctx.state.user.current_house;  
      entity = await strapi.services.recipe.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.recipe });
  },
};
