import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  CheckSquare, Clock, AlertTriangle, Layers, Users, TrendingUp,
  ArrowRight, Calendar
} from 'lucide-react'
import { format, isPast, isValid } from 'date-fns'

const STATUS_META = {
  PENDING:     { label: 'Pending',     cls: 'badge-pending' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-in_progress' },
  COMPLETED:   { label: 'Completed',   cls: 'badge-completed' },
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
  })

  const completionRate = stats?.totalTasks
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {getGreeting()}, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-gray-400 mt-1">Here's what's happening with your workspace today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Layers}       label="Total Tasks"      value={stats?.totalTasks}      color="bg-brand-600/20 text-brand-400" />
        <StatCard icon={CheckSquare}  label="Completed"        value={stats?.completedTasks}  color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={Clock}        label="In Progress"      value={stats?.inProgressTasks} color="bg-blue-500/20 text-blue-400" />
        <StatCard icon={AlertTriangle} label="Overdue"         value={stats?.overdueTasks}    color="bg-red-500/20 text-red-400" />
      </div>

      {/* Admin-only row */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Layers} label="Projects"      value={stats?.totalProjects} color="bg-violet-500/20 text-violet-400" />
          <StatCard icon={Users}  label="Team Members"  value={stats?.totalUsers}    color="bg-pink-500/20 text-pink-400" />
          <div className="stat-card">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-500/20 text-orange-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-white">{completionRate}%</p>
              <p className="text-sm text-gray-400">Completion Rate</p>
              <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Link to="/tasks" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!stats?.recentTasks?.length ? (
          <div className="text-center py-10 text-gray-500">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentTasks.map((task) => {
              const meta = STATUS_META[task.status]
              const due = task.dueDate ? new Date(task.dueDate) : null
              const overdue = due && isValid(due) && isPast(due) && task.status !== 'COMPLETED'
              return (
                <div key={task.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {task.project?.name}
                      {task.assignee && ` · ${task.assignee.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {due && isValid(due) && (
                      <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3" />
                        {format(due, 'MMM d')}
                      </span>
                    )}
                    <span className={meta.cls}>{meta.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
