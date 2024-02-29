const express = require('express');

const { requireAuth } = require('../../utils/auth.js');
const { Booking, Spot, SpotImage } = require('../../db/models');
const { validateBooking } = require('../../utils/validation.js');

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

module.exports = router;
