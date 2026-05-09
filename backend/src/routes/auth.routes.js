const router = require('express').Router();

const {
    signup,
    login,
    refresh,
    getMe
} = require('../controllers/auth.controller');

const { authenticate } = require('../middleware/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);

module.exports = router;