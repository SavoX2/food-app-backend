const router = require('express').Router();
const HttpStatus = require('http-status-codes');

const User = require('./models/user');

//Setting the default route
router.get('/', (req, res) => {
    res.status(HttpStatus.OK).json({
        status: 'Success',
        message: 'Food App root route is working!'
    });
});

router.post('/user', (req, res) => {
    const user = new User(req.body);
    user.save().then(new_user => {
        console.log(new_user);
    }).catch(e => {
        console.error(e);
    });
    res.status(HttpStatus.OK).json(user);
});

module.exports = router;