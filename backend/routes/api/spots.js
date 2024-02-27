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
        // include: {
        //     model: SpotImage,
        //     where: {
        //         preview: true
        //     },
        //     as: 'previewImage'
        // },

        // TODO: Fix this eager loading aliasing issue
        // Should be sent in body as previewImage (singular) for non-detail queries ...
        // ... and as SpotImages (non-aliased) for detail queries
        // Possible solution: Lazy load using SpotImage.findOne() instead

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

    res.json(newSpot);
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

// PUT /api/spots/:spotId
router.put('/:spotId', requireAuth, validateSpot, async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }
    if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    const {
        address, city, state, country,
        lat, lng, name, description, price
    } = req.body

    spot.address = address;
    spot.city = city;
    spot.state = state;
    spot.country = country;
    spot.lat = lat;
    spot.lng = lng;
    spot.name = name;
    spot.description = description;
    spot.price = price;

    await spot.save();
    res.json(spot);
});

// DELETE /api/spots/:spotId
router.delete('/:spotId', requireAuth, async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }
    if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    await spot.delete()
    res.json({ message: 'Successfully deleted' });
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
