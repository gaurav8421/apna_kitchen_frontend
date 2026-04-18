import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../../api/auth'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    login(form, {
      onSuccess: () => navigate('/dashboard'),
      onError: () => toast.error('Invalid email or password'),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pulse</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-60"
          >
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New restaurant?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
