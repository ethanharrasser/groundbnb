const express = require('express');

const { requireAuth } = require('../../utils/auth.js');
const { SpotImage, Spot } = require('../../db/models');

const router = express.Router();

// DELETE /api/spot-images/:imageId
router.delete('/:imageId', requireAuth, async (req, res) => {
    const spotImage = await SpotImage.findByPk(req.params.imageId);

    if (spotImage === null) {
        return res.status(404).json({ message: 'Spot Image couldn\'t be found' });
    }

    const spot = await Spot.findByPk(spotImage.spotId);

    if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await spotImage.destroy();
    res.status(200).json({ message: 'Successfully deleted' });
});

module.exports = router;
