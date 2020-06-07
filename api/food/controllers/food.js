'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const _ = require('lodash');
const axios = require('axios');
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

const getNutriments = (key, defaultValue) => {
  return key === undefined || key === '' ? defaultValue : key;
};

const getUnit = (key) => {
  return key.replace(/\d+/g, '').replace(/\s+/g, '');
};

const getQuantity = (key) => {
  return key.replace(/\D/g, '').replace(/\s+/g, '');
};

const numberRegExp = /^[0-9]+$/;

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
      entity = await strapi.services.food.create(data, { files });
    } else {
      ctx.request.body.house = ctx.state.user.current_house;
      entity = await strapi.services.food.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.food });
  },

  /**
   * Update a record.
   *
   * @return {Object}
   */

  async update(ctx) {
    const { id } = ctx.params;

    let entity;

    const [food] = await strapi.services.food.find({
      id: ctx.params.id,
      'house.id': ctx.state.user.current_house,
    });

    if (!food) {
      return ctx.unauthorized('You can\'t update this entry');
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.food.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.food.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.food });
  },

  /**
   * delete a record.
   *
   * @return {Object}
   */
  async delete(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.food.delete({ id, 'house.id': ctx.state.user.current_house });
    return sanitizeEntity(entity, { model: strapi.models.food });
  },
  
  async scan(ctx) {
    const { barcode } = ctx.params;

    const isNumber = numberRegExp.test(barcode);

    if (!isNumber) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Food.scan.barcode.not.number',
          message: 'Barcode is not valid',
          field: ['barcode']
        })
      );
    }

    const food = await strapi.services.food.findOne({ barcode, 'house.id': ctx.state.user.current_house }); 

    if (food) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Food.scan.already',
          message: 'You already have this product',
        })
      );
    }

    try {
      const response = await axios({
        method: 'get',
        url: `https://fr.openfoodfacts.org/api/v0/product/${barcode}`
      });

      if (response.data.status === 0) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Food.scan.barcode.notFound',
            message: 'Impossible to find product with this barcode.',
          })
        );
      }

      const data =  _.pick(response.data.product, ['image_url', 'product_name_fr', 'nutriments', 'quantity']);

      const product = {
        imageUrl: data.image_url,
        name: data.product_name_fr,
        barcode,
        quantity: getQuantity(data.quantity),
        unit: getUnit(data.quantity),
        nutriments: [{
          name: 'Énergie',
          unit: getNutriments(data.nutriments['energy-kcal_unit'], 'kcal'),
          value: getNutriments(data.nutriments['energy-kcal_value'], null),
        },
        {
          name: 'Matières grasses',
          unit: getNutriments(data.nutriments['fat_unit'], 'g'),
          value: getNutriments(data.nutriments['fat_value'],null),
          saturated: getNutriments(data.nutriments['saturated-fat_value'], null),
        },
        {
          name: 'Glucides',
          unit: getNutriments(data.nutriments['carbohydrates_unit'], 'g'),
          value: getNutriments(data.nutriments['carbohydrates_value'], null),
          sugars: getNutriments(data.nutriments['sugars_value'], null),
        },
        {
          name: 'Fibres',
          unit: getNutriments(data.nutriments.fiber_unit, 'g'),
          value: getNutriments(data.nutriments.fiber_100g, null),
        },
        {
          name: 'Protéines',
          unit: getNutriments(data.nutriments['proteins_unit'], 'g'),
          value: getNutriments(data.nutriments['proteins_value'], null),
        },
        {
          name: 'Sel',
          unit: getNutriments(data.nutriments.salt_unit, 'g'),
          value: getNutriments(data.nutriments.salt_100g, null),
        }
        ]
      };

      return product;

    } catch (error) {
      console.log(error);
      return ctx.internalServerError();
    }
  },
};
