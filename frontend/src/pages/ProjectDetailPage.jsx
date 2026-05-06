import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Pencil, Trash2, X, Calendar, User } from 'lucide-react'
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
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTaskId, setDeleteTaskId] = useState(null)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await api.get(`/projects/${id}`)).data,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: isAdmin,
  })

  const createMut = useMutation({
    mutationFn: (d) => api.post('/tasks', { ...d, projectId: id }),
    onSuccess: () => { qc.invalidateQueries(['project', id]); setShowCreate(false); toast.success('Task created!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const updateMut = useMutation({
    mutationFn: (d) => api.put(`/tasks/${editTask.id}`, d),
    onSuccess: () => { qc.invalidateQueries(['project', id]); setEditTask(null); toast.success('Task updated!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: (tid) => api.delete(`/tasks/${tid}`),
    onSuccess: () => { qc.invalidateQueries(['project', id]); setDeleteTaskId(null); toast.success('Task deleted') },
  })

  const TaskForm = ({ onSubmit, defaultValues, isSubmitting }) => {
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
              {usersData?.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
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

  if (isLoading) return (
    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
  )

  const tasks = project?.tasks || []
  const grouped = {
    PENDING:     tasks.filter(t => t.status === 'PENDING'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    COMPLETED:   tasks.filter(t => t.status === 'COMPLETED'),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
          {project?.description && <p className="text-gray-400 text-sm mt-0.5">{project.description}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary ml-auto">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([status, items]) => {
          const meta = STATUS_META[status]
          return (
            <div key={status} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className={meta.cls}>{meta.label}</span>
                <span className="text-xs text-gray-600 font-medium">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-center text-sm text-gray-600 py-6">No tasks</p>
                )}
                {items.map(task => {
                  const due = task.dueDate ? new Date(task.dueDate) : null
                  const overdue = due && isValid(due) && isPast(due) && task.status !== 'COMPLETED'
                  return (
                    <div key={task.id} className="bg-gray-800 border border-gray-700 rounded-xl p-3 group hover:border-gray-600 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-200 leading-snug">{task.title}</p>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => setEditTask(task)} className="p-1 text-gray-500 hover:text-brand-400 rounded transition-colors">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => setDeleteTaskId(task.id)} className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={PRIORITY_CLS[task.priority]}>{task.priority}</span>
                        {task.assignee && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />{task.assignee.name}
                          </span>
                        )}
                        {due && isValid(due) && (
                          <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                            <Calendar className="w-3 h-3" />{format(due, 'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showCreate && (
        <Modal title="New Task" onClose={() => setShowCreate(false)}>
          <TaskForm onSubmit={createMut.mutate} isSubmitting={createMut.isPending} defaultValues={{ status: 'PENDING', priority: 'MEDIUM' }} />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            onSubmit={updateMut.mutate}
            isSubmitting={updateMut.isPending}
            defaultValues={{
              title: editTask.title, description: editTask.description || '',
              status: editTask.status, priority: editTask.priority,
              assigneeId: editTask.assigneeId || '',
              dueDate: editTask.dueDate ? editTask.dueDate.slice(0, 10) : '',
            }}
          />
        </Modal>
      )}

      {deleteTaskId && (
        <Modal title="Delete Task" onClose={() => setDeleteTaskId(null)}>
          <p className="text-gray-400 mb-5">Are you sure you want to delete this task?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTaskId(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMut.mutate(deleteTaskId)} disabled={deleteMut.isPending} className="btn-danger flex-1">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
