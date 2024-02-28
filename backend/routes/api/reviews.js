const express = require('express');
const { Op } = require('sequelize');

const { requireAuth } = require('../../utils/auth.js');
const { Review } = require('../../db/models');

const router = express.Router();

// GET /api/reviews/current
router.get('/current', requireAuth, async (req, res) => {

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
