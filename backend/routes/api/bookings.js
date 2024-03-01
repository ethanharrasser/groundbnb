const express = require('express');
const { Op } = require('sequelize');

const { requireAuth } = require('../../utils/auth.js');
const { Booking, Spot, SpotImage } = require('../../db/models');

const router = express.Router();

// GET /api/bookings/current
router.get('/current', requireAuth, async (req, res) => {
    let bookings = await Booking.findAll({
        where: {
            userId: req.user.id
        },
        include: {
            model: Spot,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            }
        }
    });

    bookings = await Promise.all(
        bookings.map(async booking => {
            booking = booking.toJSON();

            // Adding previewImage attribute
            const previewImage = await SpotImage.findOne({
                attributes: ['url'],
                where: {
                    spotId: booking.spotId,
                    preview: true
                },
                limit: 1,
                raw: true
            });
            booking.Spot.previewImage = (previewImage === null) ? previewImage.url : 'No preview image';

            return booking;
        })
    );

    res.status(200).json({ Bookings: bookings });
});

// PUT /api/bookings/:bookingId
router.put('/:bookingId', requireAuth, async (req, res, next) => {
    const booking = await Booking.findByPk(req.params.bookingId);

    if (booking === null) {
        return res.status(404).json({ message: 'Booking couldn\'t be found' });
    }
    if (booking.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (new Date(booking.endDate).getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Past bookings can\'t be modified' });
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
        return next(err);
    }

    const allBookings = await Booking.findAll({
        where: {
            spotId: booking.spotId,
            [Op.not]: {
                id: booking.id
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

    booking.startDate = startDate;
    booking.endDate = endDate;

    await booking.save();
    res.status(200).json(booking);
});

// DELETE /api/bookings/:bookingId
router.delete('/:bookingId', requireAuth, async (req, res) => {
    const booking = await Booking.findByPk(req.params.bookingId);

    if (booking === null) {
        return res.status(404).json({ message: 'Booking couldn\'t be found' });
    }
    if (new Date(booking.startDate).getTime() < Date.now()) {
        return res.status(400).json({ message: 'Bookings that have been started can\'t be deleted' });
    }

    const spot = await Spot.findByPk(booking.spotId);

    if (booking.userId !== req.user.id && spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await booking.destroy();
    res.status(200).json({ message: 'Succesfully deleted' });
});

module.exports = router;
