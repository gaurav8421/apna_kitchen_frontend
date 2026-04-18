import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Register from '../pages/auth/Register'

vi.mock('../api/auth', () => ({
  useRegister: () => ({ mutate: vi.fn(), isPending: false }),
}))

function wrap(ui) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>
  )
}

describe('Register page', () => {
  it('renders all required fields', () => {
    wrap(<Register />)
    expect(screen.getByPlaceholderText(/restaurant name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })
})
