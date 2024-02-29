const express = require('express');
const bcrypt = require('bcryptjs');

const { validateSignup } = require('../../utils/validation.js');
const { setTokenCookie } = require('../../utils/auth.js');
const { User } = require('../../db/models');

const router = express.Router();

// POST /api/users
router.post('/', validateSignup, async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password);

    const user = await User.create({
        firstName,
        lastName,
        email,
        username,
        hashedPassword
    });

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

module.exports = router;
