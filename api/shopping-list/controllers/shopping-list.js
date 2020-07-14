'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');
const _ =  require('lodash');
const dayjs = require('dayjs');
require('dayjs/locale/fr');
dayjs.locale('fr');
const isBetween = require('dayjs/plugin/isBetween');
const isToday = require('dayjs/plugin/isToday');
const weekday = require('dayjs/plugin/weekday');
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(weekday);

module.exports = {
  /**
   * Retrieve a record.
   *
   * @return {Object}
   */

  async findOne(ctx) {
    const { when } = ctx.params;

    if (_.has(ctx.query, 'when') && !when) {
      return ctx.badRequest('when.not.null');
    }

    const houseID = ctx.state.user.current_house;
    const house = await strapi.services.house.findOne({ id: houseID });

    if (!house) {
      return ctx.notFound();
    }
    const weekday = dayjs().weekday(house.list_at);

    // First we check if we are the day of generation
    // If not throw Error
    if (!weekday.isToday()) {
      return ctx.badRequest('Shopping List not today');
    }

    let shoppingList = await strapi.services['shopping-list'].findOne({ when }, ['shopping_items.food.food_category']);

    if (shoppingList) {
      return sanitizeEntity(shoppingList, { model: strapi.models['shopping-list'] });
    }

    // Determine the limits of shopping List
    const dateLimits = {
      min: weekday.format('YYYY-MM-DD'),
      max: dayjs().weekday(house.list_at).add(6, 'day').format('YYYY-MM-DD')
    };

    // Get all meals
    const meals_q = await strapi.services.meal.find({ 'house.id': houseID });

    // Filter to check if when is in shopping List timeline
    let meals = _.filter(meals_q, item => {
      const when = dayjs(item.when).format('YYYY-MM-DD');
      return dayjs(when).isBetween(dateLimits.min, dateLimits.max) || dayjs(when).isSame(dateLimits.min) || dayjs(when).isSame(dateLimits.max);
    });

    // Get only ID
    meals = _.map(meals, meal => {
      return meal.id;
    });

    // Get all food and remove with lodash if doesn't IN meals
    const foods_q = await strapi.services.food.find({ 'house.id': houseID }, ['ingredients.recipe', 'aliments']);

    // Filter aliments & ingredients that are IN meals
    let foods = _.filter(foods_q, item => {
      item.aliments = _.filter(item.aliments, item => {
        return meals.includes(item.meal);
      });
      item.ingredients = _.filter(item.ingredients, item => {
        return meals.includes(item.recipe.meal);
      });

      if (item.aliments.length === 0 && item.ingredients.length === 0) {
        return false;
      }
      return true;
    });

    // Calculate the quantity of food
    foods.forEach(food => {
      food.aliments.forEach(aliment => {
        food.quantity = food.quantity - aliment.quantity;
      });
      food.ingredients.forEach(ingredient => {
        food.quantity = food.quantity - ingredient.quantity;
      });
    });

    // Make a copy in order to update foods after shopping List creation
    const foodsToUpdate = [...foods];

    // Take only foods that has negative quantity
    foods = _.filter(foods, item => {
      return item.quantity < 0;
    });

    // Update all foods quantity
    for (const food of foodsToUpdate) {
      await strapi.services['food'].update({id: food.id}, {
        quantity: food.quantity
      });
    }

    // If foods has negative quantity
    if (foods.length !== 0) {
      const shoppingItems = [];
      for (const food of foods) {
        const shoppingItem = await strapi.services['shopping-item'].create({
          bought: false,
          food: food.id
        });
        shoppingItems.push(shoppingItem.id);
      }
  
      shoppingList = await strapi.services['shopping-list'].create({
        when: weekday.format('YYYY-MM-DD'),
        house: houseID,
        shopping_items: shoppingItems 
      });

      shoppingList = await strapi.services['shopping-list'].findOne({ when }, ['shopping_items.food.food_category']);
      return sanitizeEntity(shoppingList, { model: strapi.models['shopping-list'] });
    }
    return {};
  },
};
