const express = require('express');
const { col } = require('sequelize');

const {  } = require('../../utils/validation.js');
const { requireAuth } = require('../../utils/auth.js');
const { ReviewImage, Review } = require('../../db/models');

const router = express.Router();

// DELETE /api/review-images/:imageId
router.delete('/:imageId', requireAuth, async (req, res) => {
    const reviewImage = await ReviewImage.findByPk(req.params.imageId);

    if (reviewImage === null) {
        return res.status(404).json({ message: 'Review Image couldn\'t be found' });
    }

    const review = await Review.findByPk(reviewImage.reviewId);

    if (review.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await reviewImage.destroy();
    res.status(200).json({ message: 'Successfully deleted' });
});

module.exports = router;
