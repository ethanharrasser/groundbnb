const { check, validationResult } = require('express-validator');

// Error handler middleware
const handleValidationErrors = (req, _res, next) => {
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
        const errors = {};

        validationErrors.array().forEach(error => {
            errors[error.path] = error.msg;
        });

        const err = new Error('Bad request.');
        err.errors = errors;
        err.status = 400;
        err.title = 'Bad Request';
        next(err);
    }

    next();
};

// Spot validation middleware
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

module.exports = {
    handleValidationErrors,
    validateSpot
};
