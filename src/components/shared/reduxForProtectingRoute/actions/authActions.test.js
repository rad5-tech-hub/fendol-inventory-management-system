import { loginUser, logoutUser, setActiveSite } from './authActions'
import { LOGIN_USER, LOGOUT_USER, SET_ACTIVE_SITE } from './types'

beforeEach(() => {
  sessionStorage.clear()
})

describe('loginUser', () => {
  it('creates LOGIN_USER action and stores token in sessionStorage', () => {
    const token = 'fake-jwt-token'
    const action = loginUser(token)
    expect(action.type).toBe(LOGIN_USER)
    expect(sessionStorage.getItem('authToken')).toBe(token)
  })

  it('extracts userSites from decoded token', () => {
    const action = loginUser('fake-token')
    expect(action.payload.user.userSites).toBeDefined()
    expect(Array.isArray(action.payload.user.userSites)).toBe(true)
  })

  it('handles malformed token gracefully', () => {
    const action = loginUser('not-a-valid-token')
    expect(action.type).toBe(LOGIN_USER)
    expect(action.payload.user).toBeDefined()
  })
})

describe('logoutUser', () => {
  it('creates LOGOUT_USER action and removes token from sessionStorage', () => {
    sessionStorage.setItem('authToken', 'some-token')
    const action = logoutUser()
    expect(action.type).toBe(LOGOUT_USER)
    expect(sessionStorage.getItem('authToken')).toBe(null)
  })
})

describe('setActiveSite', () => {
  it('creates SET_ACTIVE_SITE action with provided site', () => {
    const site = { id: '1', name: 'Farm A' }
    const action = setActiveSite(site)
    expect(action.type).toBe(SET_ACTIVE_SITE)
    expect(action.payload).toEqual(site)
  })

  it('creates SET_ACTIVE_SITE action with null', () => {
    const action = setActiveSite(null)
    expect(action.type).toBe(SET_ACTIVE_SITE)
    expect(action.payload).toBe(null)
  })
})
