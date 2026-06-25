import authReducer from './authReducer'
import { LOGIN_USER, LOGOUT_USER, SET_ACTIVE_SITE } from '../actions/types'

beforeEach(() => {
  sessionStorage.clear()
})

describe('authReducer — LOGIN_USER', () => {
  it('sets authenticated to true and stores user from payload', () => {
    const state = authReducer(undefined, { type: LOGIN_USER, payload: { user: { name: 'Test', userTypes: ['super_admin'] } } })
    expect(state.authenticated).toBe(true)
    expect(state.user.name).toBe('Test')
    expect(state.user.userTypes).toEqual(['super_admin'])
  })

  it('falls back to empty userTypes when payload.user is missing', () => {
    const state = authReducer(undefined, { type: LOGIN_USER, payload: {} })
    expect(state.authenticated).toBe(true)
    expect(state.user.userTypes).toEqual([])
  })
})

describe('authReducer — LOGOUT_USER', () => {
  it('clears authentication and user data', () => {
    const loggedIn = authReducer(undefined, { type: LOGIN_USER, payload: { user: { name: 'Test', userTypes: ['admin'] } } })
    const state = authReducer(loggedIn, { type: LOGOUT_USER })
    expect(state.authenticated).toBe(false)
    expect(state.user.userTypes).toEqual([])
    expect(state.activeSite).toBe(null)
  })

  it('removes activeSite from localStorage', () => {
    localStorage.setItem('fendol_active_site', JSON.stringify({ id: '1' }))
    authReducer(undefined, { type: LOGOUT_USER })
    expect(localStorage.getItem('fendol_active_site')).toBe(null)
  })
})

describe('authReducer — SET_ACTIVE_SITE', () => {
  it('sets activeSite and persists to localStorage', () => {
    const site = { id: 'site-1', name: 'Farm A' }
    const state = authReducer(undefined, { type: SET_ACTIVE_SITE, payload: site })
    expect(state.activeSite).toEqual(site)
    expect(JSON.parse(localStorage.getItem('fendol_active_site'))).toEqual(site)
  })

  it('clears activeSite when payload is null', () => {
    localStorage.setItem('fendol_active_site', JSON.stringify({ id: 'old' }))
    const state = authReducer(undefined, { type: SET_ACTIVE_SITE, payload: null })
    expect(state.activeSite).toBe(null)
    expect(localStorage.getItem('fendol_active_site')).toBe(null)
  })
})

describe('authReducer — default state', () => {
  it('returns initial state when no authToken in sessionStorage', () => {
    const state = authReducer(undefined, { type: 'UNKNOWN' })
    expect(state.authenticated).toBe(false)
    expect(state.user.userTypes).toEqual([])
    expect(state.user.userSites).toEqual([])
    expect(state.activeSite).toBe(null)
  })
})
