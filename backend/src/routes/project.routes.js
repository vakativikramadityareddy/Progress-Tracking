const router = require('express').Router();
const {
  getProjects, getProject, createProject, updateProject, deleteProject, projectValidators
} = require('../controllers/project.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', authorizeAdmin, projectValidators, validate, createProject);
router.put('/:id', authorizeAdmin, projectValidators, validate, updateProject);
router.delete('/:id', authorizeAdmin, deleteProject);

module.exports = router;
