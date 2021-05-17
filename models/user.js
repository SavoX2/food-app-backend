const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [1, 'First name is required'],
        maxLength: [255, 'First name is too long']
    },
    lastName: {
        type: String,
        required: true,
        minLength: [1, 'Last name is required'],
        maxLength: [255, 'Last name is too long']
    },
    email: {
        type: String,
        required: true,
        minLength: [1, 'Email is required'],
        maxLength: [255, 'Email is too long'],
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: props => `${props.value} is not a valid email address`
        }
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'User date of birth is required'],
        validate: {
            validator: function (v) {
                let now = new Date();
                return now.setFullYear(now.getFullYear() - 16) > v;
            },
            message: props => `${props.value} is not of legal age to work!`
        }
    },
    gender: {
        type: String,
        required: true,
        enum: ['M', 'F']
    },
    password: {
        type: String,
        required: [true, 'User password must be specified'],
        minLength: 64,
        maxLength: 64
    }
});

const User = module.exports = mongoose.model('user', userSchema, 'users');