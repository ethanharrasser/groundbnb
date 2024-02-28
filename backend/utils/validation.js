const { check, query, validationResult } = require('express-validator');

// General error handler middleware
const handleValidationErrors = (req, _res, next) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        const errors = {};

        validationErrors.array().forEach(error => {
            errors[error.path] = error.msg;
        });

        const err = new Error('Bad Request');
        err.errors = errors;
        err.status = 400;
        err.title = 'Bad Request';
        next(err);
    }

    next();
};

// Spot data validation middleware
const validateSpot = [
    check('address')
        .exists({ values: 'falsy' })
        .withMessage('Street address is required'),
    check('city')
        .exists({ values: 'falsy' })
        .withMessage('City is required'),
    check('state')
        .exists({ values: 'falsy' })
        .withMessage('State is required'),
    check('country')
        .exists({ values: 'falsy' })
        .withMessage('Country is required'),
    check('lat')
        .exists({ values: 'falsy' })
        .isDecimal()
        .custom(value => value > -90 && value < 90)
        .withMessage('Latitude must be within -90 and 90'),
    check('lng')
        .exists({ values: 'falsy' })
        .isDecimal()
        .custom(value => value > -180 && value < 180)
        .withMessage('Longitude must be within -180 and 180'),
    check('name')
        .exists({ values: 'falsy' })
        .isLength({ max: 50 })
        .withMessage('Name must be less than 50 characters'),
    check('description')
        .exists({ values: 'falsy' })
        .withMessage('Description is required'),
    check('price')
        .exists({ values: 'falsy' })
        .isDecimal()
        .custom(value => value >= 0)
        .withMessage('Price per day must be a positive number'),
    handleValidationErrors
]

// Spot query filters validation middleware
const validateSpotQueryFilters = [
    query('page')
        .default('1')
        .isInt()
        .custom(value => value >= 1 && value <= 10)
        .withMessage('Page must be greater than or equal to 1'),
    query('size')
        .default('20')
        .isInt()
        .custom(value => value >= 1 && value <= 20)
        .withMessage('Size must be greater than or equal to 1'),
    query('minLat')
        .optional()
        .isDecimal()
        .custom(value => value > -90)
        .withMessage('Minimum latitude is invalid'),
    query('maxLat')
        .optional()
        .isDecimal()
        .custom(value => value < 90)
        .withMessage('Maximum latitude is invalid'),
    query('minLng')
        .optional()
        .isDecimal()
        .custom(value => value > -180)
        .withMessage('Minimum longitude is invalid'),
    query('maxLng')
        .optional()
        .isDecimal()
        .custom(value => value < 180)
        .withMessage('Maximum longitude is invalid'),
    query('minPrice')
        .optional()
        .isDecimal()
        .custom(value => value > 0)
        .withMessage('Minimum price must be greater than or equal to 0'),
    query('maxPrice')
        .optional()
        .isDecimal()
        .custom(value => value > 0)
        .withMessage('Maximum price must be greater than or equal to 0'),
    handleValidationErrors
]

// User signup username, email, and password validation middleware
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

// Review data validation middleware
const validateReview = [
    check('review')
        .exists({ values: 'falsy' })
        .withMessage('Review text is required'),
    check('stars')
        .exists({ values: 'falsy' })
        .custom(value => value >= 1 && value <= 5)
        .withMessage('Stars must be an integer from 1 to 5'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateSpot,
    validateSignup,
    validateSpotQueryFilters,
    validateReview
};
