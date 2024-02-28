const express = require('express');
const { Op, fn, col } = require('sequelize');

const { requireAuth } = require('../../utils/auth.js');
const { Review, ReviewImage, User, Spot, SpotImage } = require('../../db/models');

const router = express.Router();

// GET /api/reviews/current
router.get('/current', requireAuth, async (req, res) => {
    let reviews = await Review.findAll({
        where: {
            userId: req.user.id
        },
        include: [
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            },
            Spot,
            {
                model: ReviewImage,
                attributes: ['id', 'url']
            }
        ]
    });

    console.log(reviews.Spot)

    reviews = await Promise.all(
        reviews.map(async review => {
            review = review.toJSON()

            // Adding previewImage attribute
            const previewImage = await SpotImage.findOne({
                attributes: ['url'],
                where: {
                    spotId: review.Spot.id,
                    preview: true
                },
                limit: 1,
                raw: true
            });
            review.Spot.previewImage = (previewImage) ? previewImage.url : 'No preview image';

            return review;
        })
    );

    res.json({ Reviews: reviews });
});

// POST /api/reviews/:reviewId/images
router.post('/:reviewId/images', requireAuth, async (req, res) => {

});

// PUT /api/reviews/:reviewId
router.put('/:reviewId', requireAuth, async (req, res) => {

});

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', requireAuth, async (req, res) => {

});

module.exports = router;
