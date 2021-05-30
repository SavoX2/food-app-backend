const router = require('express').Router();
const httpStatus = require('http-status-codes');
const errorUtil = require('./utils/errorUtil');
const User = require('./models/user');

// Setting the default route
router.get('/', (req, res) => {
    res.status(httpStatus.OK).json({
        status: 'Success',
        message: 'Food App root route is working!'
    });
});

router.post('/user', (req, res) => {
    const user = new User(req.body);
    user.save().then(new_user => {
        return res.status(httpStatus.CREATED).json({
            status: 'Success', message: 'New user created',
            user
        });
    }).catch(e => {
        console.error(e);
        const errorMessage = errorUtil.buildErrorMessage(e, 'create', 'user');
        return res.status(httpStatus.BAD_REQUEST).json({
            status: 'Failed',
            message: `Unable to create new user with provided parameters ${JSON.stringify(req.body)}. ${errorMessage}`
        });
    });

});

router.post('/login', (req, res) => {
    if (!req.body) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: 'Failed',
            message: 'No request body provided'
        });
    }
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({
            status: 'Failed',
            message: '\'email\' or \'password\' not provided in request body'
        });
    }
    User.findOne({email, password, active: true}).then(user => {
        if (user) {
            return res.status(httpStatus.OK).json({
                status: 'Success',
                message: 'User found',
                user
            });
        }
        return res.status(httpStatus.NO_CONTENT).json({
            status: 'Failed',
            message: `Unable to find user with provided credentials: 'email': ${email} and 'password' ${password}`
        });
    }).catch(err => {
        console.error(err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR);
    });
});

module.exports = router;