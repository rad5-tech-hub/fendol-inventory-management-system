import { render } from '@testing-library/react'
import {
  SkeletonLine,
  SkeletonTitle,
  SkeletonCard,
  SkeletonCircle,
  SkeletonBadge,
  SkeletonTable,
  SkeletonStatGrid,
  SkeletonFilterBar,
} from './Skeleton'

it('SkeletonLine renders with default width', () => {
  const { container } = render(<SkeletonLine />)
  const el = container.firstChild
  expect(el).toBeInTheDocument()
  expect(el.style.width).toBe('100%')
})

it('SkeletonLine renders with custom width and height', () => {
  const { container } = render(<SkeletonLine width="50%" height={20} />)
  const el = container.firstChild
  expect(el.style.width).toBe('50%')
  expect(el.style.height).toBe('20px')
})

it('SkeletonTitle renders with default width', () => {
  const { container } = render(<SkeletonTitle />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonTitle renders with custom width', () => {
  const { container } = render(<SkeletonTitle width={250} />)
  expect(container.firstChild.style.width).toBe('250px')
})

it('SkeletonCard renders', () => {
  const { container } = render(<SkeletonCard />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonCard renders with custom style', () => {
  const { container } = render(<SkeletonCard style={{ marginTop: 10 }} />)
  expect(container.firstChild.style.marginTop).toBe('10px')
})

it('SkeletonCircle renders with default size', () => {
  const { container } = render(<SkeletonCircle />)
  expect(container.firstChild.style.width).toBe('40px')
  expect(container.firstChild.style.height).toBe('40px')
})

it('SkeletonCircle renders with custom size', () => {
  const { container } = render(<SkeletonCircle size={60} />)
  expect(container.firstChild.style.width).toBe('60px')
  expect(container.firstChild.style.height).toBe('60px')
})

it('SkeletonBadge renders with default width', () => {
  const { container } = render(<SkeletonBadge />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonBadge renders with custom width', () => {
  const { container } = render(<SkeletonBadge width={120} />)
  expect(container.firstChild.style.width).toBe('120px')
})

it('SkeletonTable renders with default row/col count', () => {
  const { container } = render(<SkeletonTable />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonTable renders with custom row count', () => {
  const { container } = render(<SkeletonTable rows={3} cols={4} />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonStatGrid renders with default count', () => {
  const { container } = render(<SkeletonStatGrid />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonStatGrid renders with custom count', () => {
  const { container } = render(<SkeletonStatGrid count={2} />)
  expect(container.firstChild).toBeInTheDocument()
})

it('SkeletonFilterBar renders', () => {
  const { container } = render(<SkeletonFilterBar />)
  expect(container.firstChild).toBeInTheDocument()
})
