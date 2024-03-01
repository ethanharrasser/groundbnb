const express = require('express');
const { Op, fn, col } = require('sequelize');

const { validateSpot, validateSpotQueryFilters, validateReview } = require('../../utils/validation.js');
const { requireAuth } = require('../../utils/auth.js');
const { Spot, SpotImage, User, Review, ReviewImage, Booking } = require('../../db/models');

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

    res.status(200).json({ Spots: spots, page: page, size: size });
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

    res.status(200).json(spots);
});

// GET /api/spots/:spotId
router.get('/:spotId', async (req, res) => {
    let spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    } else {
        spot = await Spot.findByPk(req.params.spotId, {
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
                    [fn('AVG', col('Reviews.stars')), 'avgStarRating']
                ]
            }
        });
    }

    // Lazy loading User as Owner as a workaround for aliasing issues
    spot = spot.toJSON();

    const owner = await User.findByPk(spot.ownerId, {
        attributes: ['id', 'firstName', 'lastName']
    });

    spot.Owner = owner;

    res.status(200).json(spot);
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
    res.status(200).json(spot);
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
    res.status(200).json({ message: 'Successfully deleted' });
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

    res.status(200).json({
        id: spotImage.id,
        url: spotImage.url,
        preview: spotImage.preview
    });
});

// GET /api/spots/:spotId/reviews
router.get('/:spotId/reviews', async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    let reviews = await Review.findAll({
        where: {
            spotId: req.params.spotId
        },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ]
    });

    res.status(200).json({ Reviews: reviews });
});

// POST /api/spots/:spotId/reviews
router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    const existingReview = await Review.findOne({
        where: {
            userId: req.user.id
        }
    });

    if (existingReview !== null) {
        return res.status(500).json({ message: 'User already has a review for this spot' });
    }

    const review = await Review.create({
        userId: req.user.id,
        spotId: req.params.spotId,
        review: req.body.review,
        stars: req.body.stars
    });

    res.status(201).json(review);
});

// GET /api/spots/:spotId/bookings
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }

    // Set query options based on whether user is the owner of the spot
    const queryOptions = {};
    if (spot.ownerId === req.user.id) {
        queryOptions.include = {
            model: User,
            attributes: ['id', 'firstName', 'lastName']
        };
    } else {
        queryOptions.attributes = ['spotId', 'startDate', 'endDate'];
    }

    const bookings = await Booking.findAll({
        where: {
            spotId: req.params.spotId
        },
        ...queryOptions
    });

    res.status(200).json({ Bookings: bookings });
});

// POST /api/spots/:spotId/bookings
router.post('/:spotId/bookings', requireAuth, async (req, res, next) => {
    const spot = await Spot.findByPk(req.params.spotId);

    if (spot === null) {
        return res.status(404).json({ message: 'Spot couldn\'t be found' });
    }
    if (spot.ownerId === req.user.id) {
        return res.status(403).json({ message: 'Forbidden' })
    }

    const { startDate, endDate } = req.body;

    // Ignore time
    const startDateStr = new Date(startDate).toDateString();
    const startDateTime = new Date(startDateStr).getTime();
    const endDateStr = new Date(endDate).toDateString();
    const endDateTime = new Date(endDateStr).getTime();

    // Date validation middleware
    try {
        if (startDateTime <= Date.now()) {
            throw new Error('startDate cannot be in the past');
        }
        if (endDateTime <= startDateTime) {
            throw new Error('endDate cannot be on or before startDate');
        }
    } catch (err) {
        err.title = 'Bad Request';
        err.status = 400;
        next(err);
    }

    const allBookings = await Booking.findAll({
        where: {
            [Op.or]: {
                spotId: req.params.spotId,
                userId: req.user.id
            }
        }
    });

    const conflictErrors = {};

    allBookings.forEach(booking => {
        booking = booking.toJSON();

        // Ignore time
        const existingStartDateStr = new Date(booking.startDate).toDateString();
        const existingStartDateTime = new Date(existingStartDateStr).getTime();

        const existingEndDateStr = new Date(booking.endDate).toDateString();
        const existingEndDateTime = new Date(existingEndDateStr).getTime();

        console.log(`\nstartDate: ${startDate}(${startDateTime})\n`)
        console.log(`endDate: ${endDate}(${endDateTime})\n`)
        console.log(`existingStartDate: ${existingStartDateStr}(${existingStartDateTime})\n`)
        console.log(`existingEndDate: ${existingEndDateStr}(${existingEndDateTime})\n`)

        // Check conflicts with startDate
        if (startDateTime === existingStartDateTime) {
            conflictErrors.startDate = 'Start date conflicts with an existing booking';
        } else if (startDateTime === existingEndDateTime) {
            conflictErrors.startDate = 'Start date conflicts with an existing booking';
        } else if (startDateTime > existingStartDateTime && startDateTime < existingEndDateTime) {
            conflictErrors.startDate = 'Start date conflicts with an existing booking';
        }

        // Check conflicts with endDate
        if (endDateTime === existingStartDateTime) {
            conflictErrors.endDate = 'End date conflicts with an existing booking';
        } else if (endDateTime === existingEndDateTime) {
            conflictErrors.endDate = 'End date conflicts with an existing booking';
        } else if (endDateTime > existingStartDateTime && endDateTime < existingEndDateTime) {
            conflictErrors.endDate = 'End date conflicts with an existing booking';
        }

        // Check if dates surround existing dates
        if (startDateTime < existingStartDateTime && endDateTime > existingEndDateTime) {
            conflictErrors.startDate = 'Start date conflicts with an existing booking';
            conflictErrors.endDate = 'End date conflicts with an existing booking';
        }
    });

    if (Object.keys(conflictErrors).length) {
        return res.status(403).json({
            message: 'Sorry, this spot is already booked for the specified dates',
            errors: {
                ...conflictErrors
            }
        })
    }

    const booking = await Booking.create({
        spotId: req.params.spotId,
        userId: req.user.id,
        startDate,
        endDate
    });

    res.status(200).json(booking);
});

module.exports = router;
