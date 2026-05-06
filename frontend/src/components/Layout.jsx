import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',  icon: FolderKanban,    label: 'Projects' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
]

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center glow-brand">
          <CheckSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">Task Manager</p>
          <p className="text-xs text-gray-500">Team Workspace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            Users
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-800/50 mb-2">
          <div className="w-8 h-8 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-gray-900 border-r border-gray-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 h-full bg-gray-900 border-r border-gray-800 flex flex-col animate-slide-up">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center px-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
          <button
            className="lg:hidden text-gray-400 hover:text-white mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-gray-300 font-medium">Team Task Manager</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-600/20 text-brand-400 border border-brand-600/30">
                Admin
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
