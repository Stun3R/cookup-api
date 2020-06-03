const foodsCategories = require('../feed/foods_categories.json');

module.exports = async () => {
  const categories = await strapi.services['foods-categories'].find();
  if (categories.length === 0) {
    for (const foodsCategory of foodsCategories) {
      await strapi.services['foods-categories'].create({
        name: foodsCategory.name,
        icon: foodsCategory.icon
      });
    }
  }
};