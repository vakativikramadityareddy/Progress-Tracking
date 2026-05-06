const router = require('express').Router();
const { getUsers, getUser, updateUser } = require('../controllers/user.controller');
const { authenticate, authorizeAdmin, authorizeOwnerOrAdmin } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorizeAdmin, getUsers);
router.get('/:id', authorizeOwnerOrAdmin('id'), getUser);
router.put('/:id', authorizeOwnerOrAdmin('id'), updateUser);

module.exports = router;
