const prisma = require('../utils/prisma');

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true,
        assignedTasks: { select: { id: true, title: true, status: true, priority: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const isAdmin = req.user.role === 'ADMIN';

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && isAdmin && { role }),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, updateUser };
