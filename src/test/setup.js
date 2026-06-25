import '@testing-library/jest-dom/vitest'

const localStorageStore = {}
const sessionStorageStore = {}

globalThis.localStorage = {
  getItem: (key) => localStorageStore[key] ?? null,
  setItem: (key, value) => { localStorageStore[key] = String(value) },
  removeItem: (key) => { delete localStorageStore[key] },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]) },
  get length() { return Object.keys(localStorageStore).length },
  key: (i) => Object.keys(localStorageStore)[i] ?? null,
}

globalThis.sessionStorage = {
  getItem: (key) => sessionStorageStore[key] ?? null,
  setItem: (key, value) => { sessionStorageStore[key] = String(value) },
  removeItem: (key) => { delete sessionStorageStore[key] },
  clear: () => { Object.keys(sessionStorageStore).forEach(k => delete sessionStorageStore[k]) },
  get length() { return Object.keys(sessionStorageStore).length },
  key: (i) => Object.keys(sessionStorageStore)[i] ?? null,
}
