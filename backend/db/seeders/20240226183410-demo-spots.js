'use strict';

const { Spot } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: '123 Electric Ave',
        city: 'Atlantis',
        state: 'Georgia',
        country: 'United States',
        lat: 33.527658,
        lng: -84.344750,
        name: 'Underwater Abode Number One',
        description: 'Completely flooded and uninhabitable',
        price: 3.50
      },
      {
        ownerId: 1,
        address: '456 Electric Ave',
        city: 'Atlantis',
        state: 'Georgia',
        country: 'United States',
        lat: 33.527659,
        lng: -84.344751,
        name: 'Underwater Abode Number Two',
        description: 'Completely flooded and uninhabitable, same as the first one',
        price: 6.80
      },
      {
        ownerId: 2,
        address: '38 Johnson St',
        city: 'Sacramento',
        state: 'California',
        country: 'United States',
        lat: 38.741231,
        lng: -121.556249,
        name: 'Johnson Home',
        description: 'Disgusting, smells like garbage and rats',
        price: 499.99
      },
      {
        ownerId: 3,
        address: '47 Hell Rd',
        city: 'Redding',
        state: 'California',
        country: 'United States',
        lat: 40.684804,
        lng: -122.391755,
        name: 'Hell',
        description: 'Too hot, very damp, quite alike to the typical Floridan home',
        price: 716.67
      },
    ], {
      valdate: true
    });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots'
    return queryInterface.bulkDelete(options, null, {});
  }
};
