import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import SiteSelector from './SiteSelector'

const mockSites = [
  { id: 'site-1', name: 'Farm A' },
  { id: 'site-2', name: 'Farm B' },
]

const mockGet = vi.fn()
vi.mock('../api/apiLink', () => ({
  default: { get: (...args) => mockGet(...args) },
  ApiV2: { get: (...args) => mockGet(...args) },
}))

function createMockStore(activeSite = null) {
  return createStore(() => ({
    authenticated: !!activeSite,
    user: { userTypes: ['super_admin'] },
    activeSite,
  }))
}

function renderWithStore(ui, activeSite = null) {
  return render(<Provider store={createMockStore(activeSite)}>{ui}</Provider>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('shows loading state initially', () => {
  mockGet.mockReturnValue(new Promise(() => {}))
  renderWithStore(<SiteSelector />)
  expect(screen.getByText('Loading sites...')).toBeInTheDocument()
})

it('renders sites after loading', async () => {
  mockGet.mockResolvedValue({ data: { data: mockSites } })
  renderWithStore(<SiteSelector />)
  await waitFor(() => {
    expect(screen.getByText('All Sites')).toBeInTheDocument()
  })
  expect(screen.getByText('Farm A')).toBeInTheDocument()
  expect(screen.getByText('Farm B')).toBeInTheDocument()
})

it('renders empty state when no sites returned', async () => {
  mockGet.mockResolvedValue({ data: { data: [] } })
  renderWithStore(<SiteSelector />)
  await waitFor(() => {
    expect(screen.getByText('All Sites')).toBeInTheDocument()
  })
  const options = screen.getAllByRole('option')
  expect(options).toHaveLength(1)
})

it('is disabled and shows lock hint when activeSite is set', async () => {
  mockGet.mockResolvedValue({ data: { data: mockSites } })
  const activeSite = { id: 'site-1', name: 'Farm A' }
  renderWithStore(<SiteSelector />, activeSite)

  await waitFor(() => {
    expect(screen.getByText('Header site active')).toBeInTheDocument()
  })

  const select = screen.getByRole('combobox')
  expect(select).toBeDisabled()
})

it('displays custom allSitesLabel', async () => {
  mockGet.mockResolvedValue({ data: { data: mockSites } })
  renderWithStore(<SiteSelector allSitesLabel="All Farms" />)
  await waitFor(() => {
    expect(screen.getByText('All Farms')).toBeInTheDocument()
  })
})

it('handles API error gracefully', async () => {
  mockGet.mockRejectedValue(new Error('Network error'))
  renderWithStore(<SiteSelector />)
  await waitFor(() => {
    expect(screen.getByText('All Sites')).toBeInTheDocument()
  })
})

it('calls onChange when site selection changes', async () => {
  mockGet.mockResolvedValue({ data: { data: mockSites } })
  const onChange = vi.fn()
  renderWithStore(<SiteSelector onChange={onChange} />)

  await waitFor(() => {
    expect(screen.getByText('Farm A')).toBeInTheDocument()
  })

  const select = screen.getByRole('combobox')
  select.value = 'site-1'
  select.dispatchEvent(new Event('change', { bubbles: true }))

  expect(onChange).toHaveBeenCalledWith('site-1', 'Farm A')
})
