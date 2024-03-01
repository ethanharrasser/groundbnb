'use strict';

const { SpotImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await SpotImage.bulkCreate([
      {
        spotId: 1,
        url: 'https://static.wikia.nocookie.net/elderscrolls/images/9/98/Breezerhome.jpg/revision/latest/scale-to-width-down/1000?cb=20111120111740',
        preview: true
      },
      {
        spotId: 2,
        url: 'https://static.wikia.nocookie.net/elderscrolls/images/e/ed/Honeyside_view.png/revision/latest/scale-to-width-down/1000?cb=20121109235901',
        preview: true
      },
      {
        spotId: 3,
        url: 'https://static.wikia.nocookie.net/elderscrolls/images/1/1a/Proudspire_Manor_Solitude.jpg/revision/latest/scale-to-width-down/1000?cb=20111113130716',
        preview: false
      },
      {
        spotId: 4,
        url: 'https://static.wikia.nocookie.net/elderscrolls/images/7/76/Severin_Manor.png/revision/latest/scale-to-width-down/1000?cb=20130206192733',
        preview: false
      },
    ], {
      valdate: true
    });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'SpotImages'
    return queryInterface.bulkDelete(options, null, {});
  }
};
