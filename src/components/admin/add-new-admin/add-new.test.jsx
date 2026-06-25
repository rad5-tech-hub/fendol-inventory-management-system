import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import AddNew from './add-new'

const mockRoles = [
  { id: 'role-1', name: 'super_admin', type: 'super_admin' },
  { id: 'role-2', name: 'farm_manager', type: 'farm_manager' },
]
const mockSites = [{ id: 'site-1', name: 'Farm A' }]

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('../../shared/api/apiLink', () => ({
  default: { get: (...args) => mockGet(...args) },
  ApiV2: { get: (...args) => mockGet(...args), post: (...args) => mockPost(...args), patch: vi.fn() },
}))

vi.mock('../../shared/sidebar/sidebar', () => ({ default: () => null }))
vi.mock('../../shared/header/header', () => ({ default: () => null }))

function createMockStore() {
  return createStore(() => ({
    authenticated: true,
    user: { userTypes: ['super_admin'] },
    activeSite: null,
  }))
}

function renderWithProviders(ui) {
  return render(
    <Provider store={createMockStore()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockResolvedValue({ data: { roles: mockRoles, data: mockSites } })
})

async function waitForReady() {
  await waitFor(() => expect(screen.getByText('Super Admin')).toBeInTheDocument())
}

describe('validateFullName', () => {
  it('shows error when full name is too short', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. John Doe/i), { target: { value: 'A' } })
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('shows error for name with invalid characters', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. John Doe/i), { target: { value: 'John123' } })
    await waitFor(() => {
      expect(screen.getByText(/only contain letters/i)).toBeInTheDocument()
    })
  })

  it('accepts valid full name with hyphens and apostrophes', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. John Doe/i), { target: { value: "Mary-Jane O'Brien" } })
    await waitFor(() => {
      expect(screen.queryByText(/only contain letters/i)).not.toBeInTheDocument()
    })
  })
})

describe('validateEmail', () => {
  it('shows error for invalid email format', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    fireEvent.change(screen.getByPlaceholderText(/john\.doe@fendol\.com/i), { target: { value: 'not-an-email' } })
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
    })
  })

  it('accepts valid email', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    fireEvent.change(screen.getByPlaceholderText(/john\.doe@fendol\.com/i), { target: { value: 'john@example.com' } })
    await waitFor(() => {
      expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument()
    })
  })
})

describe('form submission', () => {
  it('submit button is enabled when roles and sites are loaded', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    expect(screen.getByRole('button', { name: /create admin/i })).not.toBeDisabled()
  })

  it('prevents API call when form is invalid', async () => {
    renderWithProviders(<AddNew />)
    await waitForReady()
    fireEvent.click(screen.getByRole('button', { name: /create admin/i }))
    await waitFor(() => {
      expect(mockPost).not.toHaveBeenCalled()
    })
  })
})
