'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: {
          name: 'userId',
          allowNull: false
        }
      });

      Review.belongsTo(models.Spot, {
        foreignKey: {
          name: 'spotId',
          allowNull: false
        }
      });

      Review.hasMany(models.ReviewImage, {
        foreignKey: {
          name: 'reviewId',
          allowNull: false
        },
        onDelete: 'CASCADE',
        hooks: true
      });
    }
  }
  Review.init({
    spotId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    review: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};
