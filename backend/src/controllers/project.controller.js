const { body } = require('express-validator');
const prisma = require('../utils/prisma');

const projectValidators = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      // Members see all projects but can only edit tasks assigned to them
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({ projects, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description, dueDate } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user.id,
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const { name, description, dueDate } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, projectValidators };
