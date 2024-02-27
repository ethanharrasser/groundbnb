const express = require('express');

const { validateSpot } = require('../../utils/validation.js');
const { requireAuth } = require('../../utils/auth.js');
const { Spot } = require('../../db/models');

const router = express.Router();

// GET /api/spots
router.get('/', async (req, res) => {
    const {
        page, size, minLat, maxLat,
        minLng, maxLng, minPrice, maxPrice
    } = req.query

    const spots = await Spot.findAll({

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
    const userId = req.user.id
    const spots = await Spot.findAll({
        where: {
            ownerId: userId
        }
    });
    res.json(spots);
})

// GET /api/spots/:spotId
router.get('/:spotId', async (req, res) => {
    const spotId = req.params.spotId;
    const spot = await Spot.findByPk(spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    res.json(spot);
})

module.exports = router;
