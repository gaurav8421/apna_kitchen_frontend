import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'

vi.mock('../api/auth', () => ({
  useLogout: () => ({ mutate: vi.fn() }),
}))

vi.mock('../store/authStore', () => ({
  default: (selector) =>
    selector({ user: { role: 'kitchen', org_name: 'Test Org' } }),
}))

function wrap(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Sidebar — kitchen role', () => {
  it('shows Kitchen link for kitchen role', () => {
    wrap(<Sidebar />)
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
  })

  it('shows POS link for kitchen role', () => {
    wrap(<Sidebar />)
    expect(screen.getByText('POS')).toBeInTheDocument()
  })

  it('does not show Dashboard for kitchen role', () => {
    wrap(<Sidebar />)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('does not show Orders for kitchen role', () => {
    wrap(<Sidebar />)
    expect(screen.queryByText('Orders')).not.toBeInTheDocument()
  })

  it('does not show Menu for kitchen role', () => {
    wrap(<Sidebar />)
    expect(screen.queryByText('Menu')).not.toBeInTheDocument()
  })
})
