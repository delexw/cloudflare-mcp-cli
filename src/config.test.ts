import { describe, it, expect, afterEach } from 'vitest'
import { setToken, getToken, deleteToken } from './config.js'

describe('config', () => {
  afterEach(() => {
    try {
      deleteToken()
    } catch {
      // already gone
    }
  })

  it('returns undefined when no token is stored', () => {
    deleteToken()
    expect(getToken()).toBeUndefined()
  })

  it('stores and retrieves a token', () => {
    setToken('test-token-123')
    expect(getToken()).toBe('test-token-123')
  })

  it('deletes a stored token', () => {
    setToken('test-token-456')
    deleteToken()
    expect(getToken()).toBeUndefined()
  })

  it('handles deleting a non-existent token gracefully', () => {
    deleteToken()
    expect(() => deleteToken()).not.toThrow()
  })
})
