const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation.js');
const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth.js');
const { User } = require('../../db/models');

const router = express.Router();

// POST /api/spots
router.post('/', requireAuth, async (req, res, next) => {
    const {
        ownerId, address, city, state, country,
        lat, lng, name, description, price
    } = req.body


});
