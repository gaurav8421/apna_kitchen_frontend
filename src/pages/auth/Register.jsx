import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../api/auth'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { mutate: register, isPending } = useRegister()
  const [form, setForm] = useState({
    org_name: '', name: '', email: '', password: '',
  })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.org_name) e.org_name = 'Restaurant name is required'
    if (!form.name) e.name = 'Your name is required'
    if (!form.email) e.email = 'Email is required'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    register(form, {
      onSuccess: () => {
        toast.success('Welcome to Pulse!')
        navigate('/dashboard')
      },
      onError: (err) => {
        const data = err.response?.data
        if (data?.email) toast.error(data.email[0])
        else toast.error('Registration failed. Please try again.')
      },
    })
  }

  const field = (key, placeholder, type = 'text') => (
    <div key={key}>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start managing your restaurant with Pulse</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('org_name', 'Restaurant Name')}
          {field('name', 'Your Name')}
          {field('email', 'Email', 'email')}
          {field('password', 'Password (min 8 chars)', 'password')}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl text-sm transition disabled:opacity-60"
          >
            {isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
