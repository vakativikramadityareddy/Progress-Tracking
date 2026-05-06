// const router = require('express').Router();
// const { signup, login, refresh, getMe, signupValidators, loginValidators } = require('../controllers/auth.controller');
// const { authenticate } = require('../middleware/auth.middleware');
// const { validate } = require('../middleware/validate.middleware');

// router.post('/signup', signupValidators, validate, signup);
// router.post('/login', loginValidators, validate, login);
// router.post('/refresh', refresh);
// router.get('/me', authenticate, getMe);

// module.exports = router;



const express = require('express');
const router = express.Router();

const { signup } = require('../controllers/auth.controller');

// signup route
router.post('/signup', signup);

module.exports = router;