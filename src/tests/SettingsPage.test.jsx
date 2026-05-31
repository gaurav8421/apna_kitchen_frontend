import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from '../pages/settings/SettingsPage'

vi.mock('../store/authStore', () => ({
  default: vi.fn(),
}))

import useAuthStore from '../store/authStore'

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({
        user: {
          name: 'Gaurav Mishra',
          email: 'gaurav@pulsepro.ai',
          role: 'owner',
          org_name: 'Apna Kitchen',
        },
      })
    )
  })

  it('renders page heading', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('displays user name and email', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Gaurav Mishra')).toBeInTheDocument()
    expect(screen.getByText('gaurav@pulsepro.ai')).toBeInTheDocument()
  })

  it('displays human-readable role label', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Owner')).toBeInTheDocument()
  })

  it('displays org name', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Apna Kitchen')).toBeInTheDocument()
  })

  it('shows — for missing user fields', () => {
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector({ user: { role: 'cashier' } })
    )
    render(<SettingsPage />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
