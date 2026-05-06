import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, CheckSquare, Pencil, Trash2, X, Calendar, User, Search } from 'lucide-react'
import { format, isValid, isPast } from 'date-fns'

const STATUS_META = {
  PENDING:     { label: 'Pending',     cls: 'badge-pending' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-in_progress' },
  COMPLETED:   { label: 'Completed',   cls: 'badge-completed' },
}
const PRIORITY_CLS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' }

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function TaskForm({ onSubmit, defaultValues, isSubmitting, projects, users, isAdmin }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className={`input ${errors.title ? 'border-red-500' : ''}`} placeholder="Task title"
          {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none h-16" placeholder="Optional..." {...register('description')} />
      </div>
      {isAdmin && (
        <div>
          <label className="label">Project *</label>
          <select className={`input ${errors.projectId ? 'border-red-500' : ''}`}
            {...register('projectId', { required: 'Project is required' })}>
            <option value="">Select project...</option>
            {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {errors.projectId && <p className="mt-1 text-xs text-red-400">{errors.projectId.message}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" {...register('priority')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>
      {isAdmin && (
        <div>
          <label className="label">Assign To</label>
          <select className="input" {...register('assigneeId')}>
            <option value="">Unassigned</option>
            {users?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" {...register('dueDate')} />
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Task'}
      </button>
    </form>
  )
}

export default function TasksPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', search, filterStatus, filterPriority],
    queryFn: async () => (await api.get('/tasks', {
      params: { search, status: filterStatus || undefined, priority: filterPriority || undefined, limit: 100 }
    })).data,
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => (await api.get('/projects', { params: { limit: 100 } })).data,
    enabled: isAdmin,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: isAdmin,
  })

  const createMut = useMutation({
    mutationFn: (d) => api.post('/tasks', d),
    onSuccess: () => { qc.invalidateQueries(['tasks']); setShowCreate(false); toast.success('Task created!') },
    onError: (e) => toast.error(e.response?.data?.errors?.[0]?.message || e.response?.data?.error || 'Error'),
  })

  const updateMut = useMutation({
    mutationFn: (d) => api.put(`/tasks/${editTask.id}`, d),
    onSuccess: () => { qc.invalidateQueries(['tasks']); setEditTask(null); toast.success('Task updated!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const quickStatusMut = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Status updated') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['tasks']); setDeleteId(null); toast.success('Task deleted') },
  })

  const tasks = tasksData?.tasks || []
  const projList = projectsData?.projects || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input className="input pl-9 w-40" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select className="input w-36" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">No tasks found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="text-left px-5 py-3.5 text-gray-400 font-medium">Task</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium hidden md:table-cell">Project</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium hidden lg:table-cell">Assignee</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium hidden sm:table-cell">Priority</th>
                  <th className="text-left px-4 py-3.5 text-gray-400 font-medium hidden xl:table-cell">Due</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {tasks.map(task => {
                  const due = task.dueDate ? new Date(task.dueDate) : null
                  const overdue = due && isValid(due) && isPast(due) && task.status !== 'COMPLETED'
                  const meta = STATUS_META[task.status]
                  return (
                    <tr key={task.id} className="hover:bg-gray-800/40 transition-colors group">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-200 group-hover:text-white">{task.title}</p>
                        {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-gray-400">{task.project?.name || '—'}</td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {task.assignee
                          ? <span className="flex items-center gap-1.5 text-gray-400"><User className="w-3.5 h-3.5" />{task.assignee.name}</span>
                          : <span className="text-gray-600">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          className={`${meta.cls} cursor-pointer bg-transparent border-none outline-none text-xs font-semibold`}
                          value={task.status}
                          onChange={e => quickStatusMut.mutate({ id: task.id, status: e.target.value })}
                          style={{ appearance: 'none', padding: '2px 8px' }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className={PRIORITY_CLS[task.priority]}>{task.priority}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        {due && isValid(due)
                          ? <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                              <Calendar className="w-3 h-3" />{format(due, 'MMM d, yyyy')}
                            </span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditTask(task)} className="p-1.5 text-gray-500 hover:text-brand-400 hover:bg-brand-600/10 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button onClick={() => setDeleteId(task.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <Modal title="New Task" onClose={() => setShowCreate(false)}>
          <TaskForm onSubmit={createMut.mutate} isSubmitting={createMut.isPending}
            defaultValues={{ status: 'PENDING', priority: 'MEDIUM' }}
            projects={projList} users={usersData} isAdmin={isAdmin} />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            onSubmit={updateMut.mutate} isSubmitting={updateMut.isPending}
            projects={projList} users={usersData} isAdmin={isAdmin}
            defaultValues={{
              title: editTask.title, description: editTask.description || '',
              projectId: editTask.projectId, status: editTask.status,
              priority: editTask.priority, assigneeId: editTask.assigneeId || '',
              dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : '',
            }}
          />
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Task" onClose={() => setDeleteId(null)}>
          <p className="text-gray-400 mb-5">Are you sure you want to delete this task?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMut.mutate(deleteId)} disabled={deleteMut.isPending} className="btn-danger flex-1">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
