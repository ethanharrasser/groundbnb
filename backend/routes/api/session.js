const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { check } = require('express-validator');

const { handleValidationErrors, validateLogin } = require('../../utils/validation.js');
const { setTokenCookie, restoreUser } = require('../../utils/auth.js');
const { User } = require('../../db/models');

const router = express.Router();

// GET /api/session
router.get('/', async (req, res) => {
    const { user } = req;

    if (!user) {
        return res.status(200).json({ user: null });
    };

    const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username
    };

    res.status(200).json({ user: safeUser });
});

// POST /api/session
router.post('/', validateLogin, async (req, res, next) => {
    const { credential, password } = req.body;

    const user = await User.unscoped().findOne({
        where: {
            [Op.or]: {
                username: credential,
                email: credential
            }
        }
    });

    if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
        const err = new Error('Login failed');
        err.status = 401;
        err.title = 'Login Failed';
        err.errors = { message: 'Invalid credentials' };
        return next(err);
    }

    const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username
    };

    setTokenCookie(res, safeUser);

    res.status(200).json({ user: safeUser });
});

// DELETE /api/session
router.delete('/', (_req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Successfully logged out' });
});

module.exports = router;
