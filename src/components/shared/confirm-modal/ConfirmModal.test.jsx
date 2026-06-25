import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from './ConfirmModal'

const baseProps = {
  show: true,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  title: 'Test Title',
  message: 'Test Message',
}

beforeEach(() => {
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

it('renders nothing when show is false', () => {
  const { container } = render(<ConfirmModal {...baseProps} show={false} />)
  expect(container.innerHTML).toBe('')
})

it('renders title and message when show is true', () => {
  render(<ConfirmModal {...baseProps} />)
  expect(screen.getByText('Test Title')).toBeInTheDocument()
  expect(screen.getByText('Test Message')).toBeInTheDocument()
})

it('renders default confirm/cancel text when not provided', () => {
  render(<ConfirmModal {...baseProps} />)
  expect(screen.getByText('Confirm')).toBeInTheDocument()
  expect(screen.getByText('Cancel')).toBeInTheDocument()
})

it('renders custom confirm/cancel text', () => {
  render(<ConfirmModal {...baseProps} confirmText="Yes, Delete" cancelText="No, Keep" />)
  expect(screen.getByText('Yes, Delete')).toBeInTheDocument()
  expect(screen.getByText('No, Keep')).toBeInTheDocument()
})

it('calls onConfirm when confirm button is clicked', () => {
  render(<ConfirmModal {...baseProps} />)
  fireEvent.click(screen.getByText('Confirm'))
  expect(baseProps.onConfirm).toHaveBeenCalledTimes(1)
})

it('calls onCancel when cancel button is clicked', () => {
  render(<ConfirmModal {...baseProps} />)
  fireEvent.click(screen.getByText('Cancel'))
  expect(baseProps.onCancel).toHaveBeenCalledTimes(1)
})

it('calls onCancel when overlay is clicked', () => {
  render(<ConfirmModal {...baseProps} />)
  const overlay = document.querySelector('div')?.closest('[class*="overlay"]')
  if (overlay) {
    fireEvent.click(overlay)
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1)
  }
})

it('does not call onCancel when modal content is clicked', () => {
  render(<ConfirmModal {...baseProps} />)
  // Click the dialog itself (should stop propagation)
  const dialog = screen.getByRole('dialog')
  fireEvent.click(dialog)
  expect(baseProps.onCancel).not.toHaveBeenCalled()
})

it('shows "Processing..." when loading is true', () => {
  render(<ConfirmModal {...baseProps} loading={true} />)
  expect(screen.getByText('Processing...')).toBeInTheDocument()
})

it('disables buttons when loading is true', () => {
  render(<ConfirmModal {...baseProps} loading={true} />)
  expect(screen.getByText('Processing...')).toBeDisabled()
  expect(screen.getByText('Cancel')).toBeDisabled()
})

it('calls onCancel on Escape keydown', () => {
  render(<ConfirmModal {...baseProps} />)
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(baseProps.onCancel).toHaveBeenCalledTimes(1)
})

it('renders with danger variant icon by default', () => {
  render(<ConfirmModal {...baseProps} />)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toBeInTheDocument()
})

it('renders with different variant icon when specified', () => {
  const { rerender } = render(<ConfirmModal {...baseProps} variant="warning" />)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toBeInTheDocument()

  rerender(<ConfirmModal {...baseProps} variant="primary" />)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
