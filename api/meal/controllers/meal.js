'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const _ = require('lodash');

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
      data.house = ctx.state.user.current_house;
      const { aliments, house, when, type } = data;

      const meal = await strapi.services.meal.findOne({ when, 'house.id': house, type }); 

      if (meal) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Meal.create.already',
            message: 'You already have this meal',
          })
        );
      }

      for (const aliment of aliments) {
        const result = await strapi.services['aliments'].create({
          food: aliment.food,
          quantity: parseFloat(aliment.quantity)
        });
        aliment.id = result.id;
      }

      entity = await strapi.services.meal.create(data, { files });
    } else {

      ctx.request.body.house = ctx.state.user.current_house;
      const { aliments, house, when, type } = ctx.request.body;

      const meal = await strapi.services.meal.findOne({ when, 'house.id': house, type }); 

      if (meal) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Meal.create.already',
            message: 'You already have this meal',
          })
        );
      }

      for (const aliment of aliments) {
        const result = await strapi.services['aliment'].create({
          food: aliment.food,
          quantity: parseFloat(aliment.quantity)
        });
        aliment.id = result.id;
      }

      entity = await strapi.services.meal.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.meal });
  },

  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.meal.search(ctx.query, ['aliments', 'recipes', 'aliments.food', 'aliments.food.food_category']);
    } else {
      entities = await strapi.services.meal.find(ctx.query, ['aliments', 'recipes', 'aliments.food', 'aliments.food.food_category']);
    }

    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.meal }));
  },
};