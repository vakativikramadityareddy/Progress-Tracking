import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  Plus, FolderKanban, Pencil, Trash2, X, Calendar, ChevronRight, Search
} from 'lucide-react'
import { format, isValid } from 'date-fns'

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

function ProjectForm({ onSubmit, defaultValues, isSubmitting }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Project Name *</label>
        <input className={`input ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g. Website Redesign"
          {...register('name', { required: 'Name is required' })} />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input resize-none h-20" placeholder="Optional description..."
          {...register('description')} />
      </div>
      <div>
        <label className="label">Due Date</label>
        <input type="date" className="input" {...register('dueDate')} />
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
          {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Project'}
        </button>
      </div>
    </form>
  )
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search],
    queryFn: async () => (await api.get('/projects', { params: { search, limit: 50 } })).data,
  })

  const createMut = useMutation({
    mutationFn: (d) => api.post('/projects', d),
    onSuccess: () => { qc.invalidateQueries(['projects']); setShowCreate(false); toast.success('Project created!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const updateMut = useMutation({
    mutationFn: (d) => api.put(`/projects/${editProject.id}`, d),
    onSuccess: () => { qc.invalidateQueries(['projects']); setEditProject(null); toast.success('Project updated!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries(['projects']); setDeleteId(null); toast.success('Project deleted') },
    onError: (e) => toast.error(e.response?.data?.error || 'Error'),
  })

  const projects = data?.projects || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input className="input pl-9 w-48" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Project
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-16">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">No projects found</p>
          {isAdmin && <p className="text-gray-600 text-sm mt-1">Create your first project to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const due = p.dueDate ? new Date(p.dueDate) : null
            return (
              <div key={p.id} className="card hover:border-gray-700 transition-all duration-200 group flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-4 h-4 text-brand-400" />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditProject(p)} className="p-1.5 text-gray-500 hover:text-brand-400 hover:bg-brand-600/10 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">{p.name}</h3>
                {p.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> {p._count?.tasks || 0} tasks
                    </span>
                    {due && isValid(due) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {format(due, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <Link to={`/projects/${p.id}`} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium">
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="New Project" onClose={() => setShowCreate(false)}>
          <ProjectForm onSubmit={createMut.mutate} isSubmitting={createMut.isPending} />
        </Modal>
      )}

      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm
            onSubmit={updateMut.mutate}
            isSubmitting={updateMut.isPending}
            defaultValues={{
              name: editProject.name,
              description: editProject.description || '',
              dueDate: editProject.dueDate ? editProject.dueDate.slice(0, 10) : '',
            }}
          />
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Project" onClose={() => setDeleteId(null)}>
          <p className="text-gray-400 mb-5">This will permanently delete the project and all its tasks. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={() => deleteMut.mutate(deleteId)} disabled={deleteMut.isPending} className="btn-danger flex-1">
              {deleteMut.isPending ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
