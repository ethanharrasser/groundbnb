const express = require('express');

const { requireAuth } = require('../../utils/auth.js');
const { Review, ReviewImage, User, Spot, SpotImage } = require('../../db/models');
const { validateReview } = require('../../utils/validation.js');

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

    res.status(200).json({ Reviews: reviews });
});

// POST /api/reviews/:reviewId/images
router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const review = await Review.findByPk(req.params.reviewId);

    if (review === null) {
        return res.status(404).json({ message: 'Review couldn\'t be found' });
    }
    if (review.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const reviewImageCount = await ReviewImage.count({
        where: {
            reviewId: req.params.reviewId
        }
    });

    console.log(`review image count: ${reviewImageCount} ... req.params.reviewId: ${req.params.reviewId} ... `);

    if (reviewImageCount === 10) {
        return res.status(403).json({ message: 'Maximum number of images for this resource was reached' });
    }

    const reviewImage = await ReviewImage.create({
        reviewId: req.params.reviewId,
        url: req.body.url
    });

    res.status(200).json({ id: reviewImage.id, url: reviewImage.url });
});

// PUT /api/reviews/:reviewId
router.put('/:reviewId', requireAuth, validateReview, async (req, res) => {
    const existingReview = await Review.findByPk(req.params.reviewId);

    if (existingReview === null) {
        return res.status(404).json({ message: 'Review couldn\'t be found' });
    }
    if (existingReview.userId !== req.user.id) {
        console.log(existingReview.userId)
        return res.status(403).json({ message: 'Forbidden' })
    }

    const { review, stars } = req.body

    existingReview.review = review;
    existingReview.stars = stars;

    await existingReview.save();
    res.status(200).json(existingReview);
});

// DELETE /api/reviews/:reviewId
router.delete('/:reviewId', requireAuth, async (req, res) => {
    const existingReview = await Review.findByPk(req.params.reviewId);

    if (existingReview === null) {
        return res.status(404).json({ message: 'Review couldn\'t be found' });
    }
    if (existingReview.userId !== req.user.id) {
        console.log(existingReview.userId)
        return res.status(403).json({ message: 'Forbidden' })
    }

    existingReview.destroy();
    res.status(200).json({ message: 'Successfully deleted' });
});

module.exports = router;
