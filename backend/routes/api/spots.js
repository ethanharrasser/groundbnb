const express = require('express');
const { Op } = require('sequelize');

const { validateSpot, validateSpotQueryFilters } = require('../../utils/validation.js');
const { requireAuth } = require('../../utils/auth.js');
const { Spot, SpotImage } = require('../../db/models');

const router = express.Router();

// GET /api/spots
router.get('/', validateSpotQueryFilters, async (req, res) => {
    const {
        page, size, minLat, maxLat,
        minLng, maxLng, minPrice, maxPrice
    } = req.query

    const pagination = {
        limit: size,
        offset: (page - 1) * size
    };

    const queryFilters = {
        where: {}
    };

    // Adding minLat and maxLat filters
    if (minLat && maxLat) {
        queryFilters.where.lat = {[Op.and]: {
            [Op.gte]: minLat,
            [Op.lte]: maxLat
        }};
    } else {
        if (minLat) {
            queryFilters.where.lat = { [Op.gte]: minLat };
        } else if (maxLat) {
            queryFilters.where.lat = { [Op.lte]: maxLat };
        }
    }

    // Adding minLng and maxLng filters
    if (minLng && maxLng) {
        queryFilters.where.lng = {[Op.and]: {
            [Op.gte]: minLng,
            [Op.lte]: maxLng
        }};
    } else {
        if (minLng) {
            queryFilters.where.lng = { [Op.gte]: minLng };
        } else if (maxLng) {
            queryFilters.where.lng = { [Op.lte]: maxLng };
        }
    }

    // Adding minPrice and maxPrice filters
    if (minPrice && maxPrice) {
        queryFilters.where.price = {[Op.and]: {
            [Op.gte]: minPrice,
            [Op.lte]: maxPrice
        }};
    } else {
        if (minPrice) {
            queryFilters.where.price = { [Op.gte]: minPrice };
        } else if (maxPrice) {
            queryFilters.where.price = { [Op.lte]: maxPrice };
        }
    }

    const spots = await Spot.findAll({
        ...queryFilters,
        ...pagination
    });

    res.json(spots);
});

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

// GET /api/spots/current
router.get('/current', requireAuth, async (req, res) => {
    const spots = await Spot.findAll({
        where: {
            ownerId: req.user.id
        }
    });
    res.json(spots);
});

// GET /api/spots/:spotId
router.get('/:spotId', async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    res.json(spot);
});

// POST /api/spots/:spotId/images
router.post('/:spotId/images', requireAuth, async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }
    if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    const { url, preview } = req.body;
    const spotImage = await SpotImage.create({
        url,
        preview
    });

    res.json(spotImage);
});

module.exports = router;
