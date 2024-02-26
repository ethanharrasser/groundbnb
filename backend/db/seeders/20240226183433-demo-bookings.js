'use strict';

const { Booking } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Booking.bulkCreate([
      {
        spotId: 1,
        userId: 3,
        startDate: '2003-05-26',
        endDate: '2003-05-29'
      },
      {
        spotId: 1,
        userId: 4,
        startDate: '2003-06-14',
        endDate: '2003-06-17'
      },
      {
        spotId: 2,
        userId: 1,
        startDate: '2008-03-21',
        endDate: '2009-11-30'
      },
      {
        spotId: 4,
        userId: 2,
        startDate: '2024-02-27',
        endDate: '2024-02-28'
      }
    ], {
      validate: true
    });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Bookings'
    const Op = Sequelize.Op
    return queryInterface.bulkDelete(options, {
      startDate: {
        [Op.in]: [
          '2003-05-26',
          '2003-06-14',
          '2008-03-21',
          '2024-02-27'
        ]
      }
    }, {});
  }
};
