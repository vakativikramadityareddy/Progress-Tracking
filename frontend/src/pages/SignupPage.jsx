import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { UserPlus, Eye, EyeOff, CheckSquare } from 'lucide-react'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      await signup(data.name, data.email, data.password, data.role)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 gradient-brand rounded-2xl glow-brand mb-4">
            <CheckSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-1">Join Team Task Manager</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label" htmlFor="signup-name">Full name</label>
              <input id="signup-name" className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="John Doe"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="signup-email">Email address</label>
              <input id="signup-email" type="email" className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="signup-role">Role</label>
              <select id="signup-role" className="input"
                {...register('role')}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input id="signup-password" type={showPw ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Min. 6 characters"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full text-base py-3">
              {isSubmitting
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><UserPlus className="w-5 h-5" /> Create account</>
              }
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
