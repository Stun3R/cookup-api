'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');
const _ = require('lodash');
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  async join(ctx) {
    const { uuid } = ctx.params;

    const entity = await strapi.services.house.findOne({ uuid }, ['users']);

    if (!entity) {
      return ctx.notFound();
    }
    const user = await strapi.query('user', 'users-permissions').findOne({id: ctx.state.user.id}, ['houses']);

    const houses = user.houses;

    const inHouse = _.find(houses, { id: entity.id});

    if (inHouse) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'House.join.already',
          message: 'You already have this house',
        })
      );
    }

    houses.push(entity);

    const updateUser = await strapi.query('user', 'users-permissions').update({ id: ctx.state.user.id }, {
      houses: houses,
      current_house: entity.id
    });

    return sanitizeEntity(updateUser, {
      model: strapi.query('user', 'users-permissions').model,
    });
  },

  async leave(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.house.findOne({ id }, ['users']);

    if (!entity) {
      return ctx.notFound();
    }
    const user = await strapi.plugins['users-permissions'].services.user.fetch({id: ctx.state.user.id}, ['houses', 'current_house']);
    let { houses, current_house } = user;  

    const inHouse = _.find(houses, { id: entity.id});

    if (!inHouse) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'House.leave.already',
          message: 'You already leave this house',
        })
      );
    }

    const isCurrentHouse = parseInt(id) === current_house.id;

    houses = _.filter(houses,  (item) => { return item.id !== parseInt(id, 10); });

    const options = {
      houses
    };

    if (isCurrentHouse) {
      options.current_house = null;
    }

    const updateUser = await strapi.plugins['users-permissions'].services.user.edit({ id: ctx.state.user.id }, options);

    if (entity.users.length === 1) {
      await strapi.services.house.delete({ id });
    }

    return sanitizeEntity(updateUser, {
      model: strapi.query('user', 'users-permissions').model,
    });
  }
};
