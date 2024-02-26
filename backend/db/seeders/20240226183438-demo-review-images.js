'use strict';

const { ReviewImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await ReviewImage.bulkCreate([
      {
        reviewId: 1,
        url: 'https://images.uesp.net/thumb/6/66/SR-interior-Breezehome_07.jpg/200px-SR-interior-Breezehome_07.jpg'
      },
      {
        reviewId: 3,
        url: 'https://images.uesp.net/thumb/5/58/SR-interior-Honeyside_02.jpg/200px-SR-interior-Honeyside_02.jpg'
      },
      {
        reviewId: 3,
        url: 'https://images.uesp.net/thumb/e/ea/SR-interior-Honeyside.jpg/200px-SR-interior-Honeyside.jpg'
      }
    ], {
      validate: true
    });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'ReviewImages'
    const Op = Sequelize.Op
    return queryInterface.bulkDelete(options, {
      url: {
        [Op.in]: []
      }
    }, {});
  }
};
