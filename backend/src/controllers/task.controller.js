const { body } = require('express-validator');
const prisma = require('../utils/prisma');

const taskValidators = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

const updateTaskValidators = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED']).withMessage('Invalid status'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
];

const getTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, projectId, assigneeId, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const isAdmin = req.user.role === 'ADMIN';

    const where = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(projectId && { projectId }),
      // Members only see their assigned tasks
      ...(!isAdmin && { assigneeId: req.user.id }),
      ...(assigneeId && isAdmin && { assigneeId }),
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Members can only view their own tasks
    if (req.user.role !== 'ADMIN' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, projectId, assigneeId, dueDate } = req.body;

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const isAdmin = req.user.role === 'ADMIN';

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    // Members can only update status of their own tasks
    if (!isAdmin && existing.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && isAdmin && { title }),
        ...(description !== undefined && isAdmin && { description }),
        ...(status && { status }),
        ...(priority && isAdmin && { priority }),
        ...(assigneeId !== undefined && isAdmin && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && isAdmin && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, taskValidators, updateTaskValidators };
