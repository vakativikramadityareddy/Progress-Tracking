const router = require('express').Router();
const {
  getTasks, getTask, createTask, updateTask, deleteTask, taskValidators, updateTaskValidators
} = require('../controllers/task.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', authorizeAdmin, taskValidators, validate, createTask);
router.put('/:id', updateTaskValidators, validate, updateTask);
router.delete('/:id', authorizeAdmin, deleteTask);

module.exports = router;
