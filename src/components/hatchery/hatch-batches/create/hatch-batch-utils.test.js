import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { f, generateBatchNo, parseDate, formatDate, serializeForm, deserializeForm } from './hatch-batch-utils'

describe('f', () => {
  it('formats a number with locale grouping', () => {
    expect(f(1234567)).toBe('1,234,567')
  })

  it('formats zero', () => {
    expect(f(0)).toBe('0')
  })

  it('formats a small number', () => {
    expect(f(42)).toBe('42')
  })
})

describe('generateBatchNo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a batch number in the format HB-{year}-{seq}', () => {
    vi.setSystemTime(new Date('2026-06-25T12:34:56'))
    const result = generateBatchNo()
    expect(result).toMatch(/^HB-2026-\d{4}$/)
  })

  it('seq portion is exactly 4 digits', () => {
    vi.setSystemTime(new Date('2026-06-25T12:34:56'))
    const result = generateBatchNo()
    const seq = result.split('-')[2]
    expect(seq).toMatch(/^\d{4}$/)
  })
})

describe('parseDate', () => {
  it('parses YYYY-MM-DD format', () => {
    const d = parseDate('2024-01-15')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
  })

  it('parses ISO string', () => {
    const d = parseDate('2024-06-15T00:00:00.000Z')
    expect(d).toBeInstanceOf(Date)
    expect(d.getTime()).toBeGreaterThan(0)
  })

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parseDate(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parseDate(undefined)).toBeNull()
  })

  it('returns null for invalid string', () => {
    expect(parseDate('not-a-date')).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    const d = new Date(2024, 0, 15)
    expect(formatDate(d)).toBe('2024-01-15')
  })

  it('pads month and day to two digits', () => {
    const d = new Date(2024, 2, 5)
    expect(formatDate(d)).toBe('2024-03-05')
  })

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(formatDate(new Date('invalid'))).toBe('')
  })
})

describe('serializeForm', () => {
  it('converts Date fields to YYYY-MM-DD strings', () => {
    const form = {
      numFemales: 10,
      dateInjected: new Date(2024, 0, 15),
      dateStripped: new Date(2024, 0, 20),
      dateHatched: new Date(2024, 1, 10),
    }
    const result = serializeForm(form)
    expect(result.dateInjected).toBe('2024-01-15')
    expect(result.dateStripped).toBe('2024-01-20')
    expect(result.dateHatched).toBe('2024-02-10')
    expect(result.numFemales).toBe(10)
  })

  it('sets null when date field is not a Date', () => {
    const form = { dateInjected: null, dateStripped: undefined, dateHatched: 'not-a-date' }
    const result = serializeForm(form)
    expect(result.dateInjected).toBeNull()
    expect(result.dateStripped).toBeNull()
    expect(result.dateHatched).toBeNull()
  })

  it('spreads other fields unchanged', () => {
    const form = { numFemales: 5, notes: 'test', dateInjected: new Date(2024, 0, 1), dateStripped: null, dateHatched: null }
    const result = serializeForm(form)
    expect(result.numFemales).toBe(5)
    expect(result.notes).toBe('test')
  })
})

describe('deserializeForm', () => {
  it('converts date strings to Date objects', () => {
    const data = {
      hatchbatchNo: 'HB-2026-001',
      dateInjected: '2024-01-15',
      dateStripped: '2024-01-20',
      dateHatched: '2024-02-10',
    }
    const result = deserializeForm(data)
    expect(result.dateInjected).toBeInstanceOf(Date)
    expect(result.dateInjected.getFullYear()).toBe(2024)
    expect(result.dateInjected.getMonth()).toBe(0)
    expect(result.dateInjected.getDate()).toBe(15)
    expect(result.dateStripped).toBeInstanceOf(Date)
    expect(result.dateHatched).toBeInstanceOf(Date)
    expect(result.hatchbatchNo).toBe('HB-2026-001')
  })

  it('sets null when date string is missing', () => {
    const data = { dateInjected: '', dateStripped: null, dateHatched: undefined }
    const result = deserializeForm(data)
    expect(result.dateInjected).toBeNull()
    expect(result.dateStripped).toBeNull()
    expect(result.dateHatched).toBeNull()
  })

  it('spreads other fields unchanged', () => {
    const data = { numFemales: '10', notes: 'hello', dateInjected: '2024-01-01', dateStripped: null, dateHatched: '' }
    const result = deserializeForm(data)
    expect(result.numFemales).toBe('10')
    expect(result.notes).toBe('hello')
  })
})
