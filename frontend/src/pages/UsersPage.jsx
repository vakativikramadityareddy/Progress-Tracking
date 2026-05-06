import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { Users, Mail, Shield, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const ROLE_CLS = {
  ADMIN:  'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-600/20 text-brand-400 border border-brand-600/30',
  MEMBER: 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-700/50 text-gray-400 border border-gray-700',
}

export default function UsersPage() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Team Members</h1>
        <p className="text-gray-400 text-sm mt-1">{users?.length ?? '—'} member{users?.length !== 1 ? 's' : ''}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {users?.map(user => (
            <div key={user.id} className="card hover:border-gray-700 transition-all duration-200 group">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-100 truncate group-hover:text-white">{user.name}</p>
                    <span className={ROLE_CLS[user.role]}>{user.role}</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1 truncate">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />{user.email}
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-2">
                    <Calendar className="w-3 h-3" />
                    Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
