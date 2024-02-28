const express = require('express');
const { Op, fn, col } = require('sequelize');

const { validateSpot, validateSpotQueryFilters } = require('../../utils/validation.js');
const { requireAuth } = require('../../utils/auth.js');
const { Spot, SpotImage, Review, User } = require('../../db/models');

const router = express.Router();

// GET /api/spots
router.get('/', validateSpotQueryFilters, async (req, res) => {
    let {
        page, size, minLat, maxLat,
        minLng, maxLng, minPrice, maxPrice
    } = req.query

    // Convert to integers
    page = +page;
    size = +size;

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

    let spots = await Spot.findAll({
        ...queryFilters,
        ...pagination,

        // // Eager load previewImage
        // include: {
        //     model: SpotImage,
        //     attributes: [['url', 'previewImage']],
        //     where: {
        //         preview: true,
        //     },
        //     limit: 1,
        // }
    });

    // This entire block could probably be condensed into a helper function - todo later?
    // addAvgRatingAndPreviewImage
    spots = await Promise.all(
        spots.map(async spot => {
            spot = spot.toJSON()

            // Adding avgRating attribute
            const { count, rows } = await Review.findAndCountAll({
                attributes: ['stars'],
                where: {
                    spotId: spot.id
                },
                raw: true
            });
            const avgRating = rows.reduce((acc, ele) => acc + ele.stars, 0) / count;
            spot.avgRating = (avgRating) ? avgRating : 'No reviews yet';

            // Adding previewImage attribute
            const previewImage = await SpotImage.findOne({
                attributes: ['url'],
                where: {
                    spotId: spot.id,
                    preview: true
                },
                limit: 1,
                raw: true
            });
            spot.previewImage = (previewImage) ? previewImage.url : 'No preview image';

            return spot;
        })
    );

    res.json({ Spots: spots, page: page, size: size });
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
    let spots = await Spot.findAll({
        where: {
            ownerId: req.user.id
        }
    });

    // addAvgRatingAndPreviewImage
    spots = await Promise.all(
        spots.map(async spot => {
            spot = spot.toJSON()

            // Adding avgRating attribute
            const { count, rows } = await Review.findAndCountAll({
                attributes: ['stars'],
                where: {
                    spotId: spot.id
                },
                raw: true
            });
            const avgRating = rows.reduce((acc, ele) => acc + ele.stars, 0) / count;
            spot.avgRating = (avgRating) ? avgRating : 'No reviews yet';

            // Adding previewImage attribute
            const previewImage = await SpotImage.findOne({
                attributes: ['url'],
                where: {
                    spotId: spot.id,
                    preview: true
                },
                limit: 1,
                raw: true
            });
            spot.previewImage = (previewImage) ? previewImage.url : 'No preview image';

            return spot;
        })
    );

    res.json(spots);
});

// GET /api/spots/:spotId
router.get('/:spotId', async (req, res) => {
    let spot = await Spot.findByPk(req.params.spotId, {
        include: [
            {
                model: SpotImage
            },
            {
                model: Review,
                attributes: []
            }
        ],
        attributes: {
            include: [
                [fn('COUNT', col('Reviews.id')), 'numReviews'],
                [fn('AVG', col('Reviews.stars')), 'avgRating']
            ]
        }
    });

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    // Lazy loading User as Owner as a workaround for aliasing issues
    spot = spot.toJSON();

    const owner = await User.findByPk(spot.ownerId, {
        attributes: ['id', 'firstName', 'lastName']
    });

    spot.Owner = owner;

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
