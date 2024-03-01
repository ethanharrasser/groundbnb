const express = require('express');

const { requireAuth } = require('../../utils/auth.js');
const { Booking, Spot, SpotImage } = require('../../db/models');
// const {  } = require('../../utils/validation.js');

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
            booking = booking.toJSON()

            // Adding previewImage attribute
            const previewImage = await SpotImage.findOne({
                attributes: ['url'],
                where: {
                    spotId: booking.Spot.id,
                    preview: true
                },
                limit: 1,
                raw: true
            });
            booking.Spot.previewImage = (previewImage) ? previewImage.url : 'No preview image';

            return booking;
        })
    );

    res.status(200).json({ Bookings: bookings });
});

// PUT /api/bookings/:bookingId
router.put('/:bookingId', requireAuth, async (req, res) => {
    const booking = await Booking.findByPk(req.params.bookingId);

    if (booking === null) {
        return res.status(404).json({ message: 'Booking couldn\'t be found' });
    }
    if (booking.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (new Date(booking.endDate).getTime() >= Date.now()) {
        return res.status(400).json({ message: 'Past bookings can\'t be modified' });
    }

    const { startDate, endDate } = req.body;

    // TODO: Check for conflicting booking dates

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
    if (new Date(booking.startDate).getTime() >= Date.now()) {
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
