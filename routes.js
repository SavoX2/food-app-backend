const router = require('express').Router();
const HttpStatus = require('http-status-codes');

//Setting the default route
router.get('/', (req, res) => {
    res.status(HttpStatus.OK).json({
        status: 'Success',
        message: 'Food App root route is working!'
    });
});

module.exports = router;