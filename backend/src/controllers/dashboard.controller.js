const prisma = require('../utils/prisma');

const getStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const now = new Date();

    const taskWhere = isAdmin ? {} : { assigneeId: req.user.id };
    const overdueWhere = {
      ...taskWhere,
      dueDate: { lt: now },
      status: { not: 'COMPLETED' },
    };

    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      totalProjects,
      totalUsers,
      recentTasks,
    ] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'PENDING' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'COMPLETED' } }),
      prisma.task.count({ where: overdueWhere }),
      isAdmin ? prisma.project.count() : Promise.resolve(null),
      isAdmin ? prisma.user.count() : Promise.resolve(null),
      prisma.task.findMany({
        where: taskWhere,
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.json({
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      ...(isAdmin && { totalProjects, totalUsers }),
      recentTasks,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
