const express = require('express');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');

const { handleValidationErrors } = require('../../utils/validation.js');
const { setTokenCookie, requireAuth } = require('../../utils/auth.js');
const { User } = require('../../db/models');

const router = express.Router();

// Username, email, and password validation middleware
const validateSignup = [
    check('firstName')
        .exists({ values: 'falsy' })
        .isLength({ min: 2 })
        .withMessage('Please provide a first name with 2 or more characters.'),
    check('lastName')
        .exists({ values: 'falsy' })
        .isLength({ min: 2 })
        .withMessage('Please provide a last name with 2 or more characters.'),
    check('email')
        .exists({ values: 'falsy' })
        .isEmail()
        .withMessage('Please provide a valid email address.'),
    check('username')
        .exists({ values: 'falsy' })
        .isLength({ min: 4 })
        .withMessage('Please provide a username with 4 or more characters.'),
    check('username')
        .not()
        .isEmail()
        .withMessage('Username cannot be an email address.'),
    check('password')
        .exists({ values: 'falsy' })
        .isLength({ min: 6 })
        .withMessage('Password must be 6 or more characters.'),
    handleValidationErrors
];

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

    await setTokenCookie(res, safeUser);
    res.json({ user: safeUser });
});

module.exports = router;
