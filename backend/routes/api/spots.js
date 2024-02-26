const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation.js');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth.js');
const { Spot } = require('../../db/models');

const router = express.Router();

// Spot validation middleware
const validateSpot = [
    check('address')
        .exists({ values: 'falsy' })
        .withMessage('Street address is required'),
    check('city')
        .exists({ values: 'falsy' })
        .withMessage('City is required'),
    check('state')
        .exists({ values: 'falsy' })
        .withMessage('State is required'),
    check('country')
        .exists({ values: 'falsy' })
        .withMessage('Country is required'),
    check('lat')
        .exists({ values: 'falsy' })
        .isDecimal()
        .custom(value => value > -90 && value < 90)
        .withMessage('Latitude must be within -90 and 90'),
    check('lng')
        .exists({ values: 'falsy' })
        .isDecimal()
        .custom(value => value > -180 && value < 180)
        .withMessage('Longitude must be within -180 and 180'),
    check('name')
        .exists({ values: 'falsy' })
        .isLength({ max: 50 })
        .withMessage('Name must be less than 50 characters'),
    check('description')
        .exists({ values: 'falsy' })
        .withMessage('Description is required'),
    check('price')
        .exists({ values: 'falsy' })
        .isDecimal()
        .custom(value => value >= 0)
        .withMessage('Price per day must be a positive number'),
    handleValidationErrors
]

// POST /api/spots
router.post('/', requireAuth, validateSpot, async (req, res) => {
    const {
        address, city, state, country,
        lat, lng, name, description, price
    } = req.body

    const newSpot = await Spot.create({
        ownerId: req.user.id,

        address, city, state, country,
        lat, lng, name, description, price
    });

    res.status(201).json(newSpot);
});

module.exports = router;
