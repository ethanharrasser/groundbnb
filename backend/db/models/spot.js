'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    static associate(models) {
      Spot.belongsTo(models.User, {
        foreignKey: {
          name: 'ownerId',
          allowNull: false
        }
      });

      Spot.hasMany(models.Review, {
        foreignKey: {
          name: 'spotId',
          allowNull: false
        },
        onDelete: 'CASCADE',
        hooks: true
      });

      Spot.hasMany(models.Booking, {
        foreignKey: {
          name: 'spotId',
          allowNull: false
        },
        onDelete: 'CASCADE',
        hooks: true
      });

      Spot.hasMany(models.SpotImage, {
        foreignKey: {
          name: 'spotId',
          allowNull: false
        },
        onDelete: 'CASCADE',
        hooks: true
      });
    }
  }
  Spot.init({
    ownerId: DataTypes.INTEGER,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    lat: DataTypes.DECIMAL,
    lng: DataTypes.DECIMAL,
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL,
      validate: {
        min: 0
      }
    }
  }, {
    sequelize,
    modelName: 'Spot',
  });
  return Spot;
};
