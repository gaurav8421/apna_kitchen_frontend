import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, BarChart2, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { useLogin } from '../../api/auth'
import toast from 'react-hot-toast'

const FEATURES = [
  { icon: ShoppingCart,    text: 'Fast POS with real-time kitchen sync' },
  { icon: BarChart2,       text: 'Daily sales & expense reports' },
  { icon: UtensilsCrossed, text: 'Menu, inventory & staff in one place' },
]

export default function Login() {
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)

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
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">Apna Restaurant</span>
        </div>

        {/* Centre copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-snug mb-4">
            Restaurant management,<br />simplified.
          </h2>
          <p className="text-orange-100 text-base mb-10">
            Everything your team needs — from the kitchen to the counter.
          </p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-orange-50 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-orange-200 text-xs">© 2026 Pulse · Built for restaurants</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <Zap size={17} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Pulse</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your restaurant dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@restaurant.com"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder:text-gray-400"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60 mt-2 shadow-sm shadow-orange-200"
            >
              {isPending ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New restaurant?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
