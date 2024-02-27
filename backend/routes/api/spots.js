const express = require('express');

const { validateSpot, validateSpotQueryFilters } = require('../../utils/validation.js');
const { requireAuth } = require('../../utils/auth.js');
const { Spot, SpotImage } = require('../../db/models');

const router = express.Router();

// GET /api/spots
router.get('/', async (req, res) => {
    let {
        page, size, minLat, maxLat,
        minLng, maxLng, minPrice, maxPrice
    } = req.query

    const spots = await Spot.findAll();

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
