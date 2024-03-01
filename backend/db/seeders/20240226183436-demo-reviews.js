'use strict';

const { Review } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        spotId: 1,
        userId: 3,
        review: 'Very nice place, had a couple weird smells in the cabinets.',
        stars: 4
      },
      {
        spotId: 1,
        userId: 4,
        review: 'Waste of money. Laundry machine made my clothes dirtier. Nice bed though',
        stars: 2
      },
      {
        spotId: 2,
        userId: 3,
        review: 'Made me inexplicably commit arson. Currently serving 8 years. House is probably haunted.',
        stars: 1
      },
      {
        spotId: 3,
        userId: 1,
        review: 'the owner broke up with me. i didnt even book the place',
        stars: 1
      },
      {
        spotId: 3,
        userId: 2,
        review: 'the owner and i got married after having an affair. Great place',
        stars: 5
      }
    ], {
      validate: true
    })
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Reviews'
    return queryInterface.bulkDelete(options, null, {});
  }
};
