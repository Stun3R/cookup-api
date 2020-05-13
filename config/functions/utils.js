module.exports = {
  get isProduction() {
    return strapi.config.environment === 'production';
  },
  get isDevelopment() {
    return strapi.config.environment === 'development';
  },
  get isStaging() {
    return strapi.config.environment === 'staging';
  },
};