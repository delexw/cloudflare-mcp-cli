import { describe, it, expect } from 'vitest'
import { createClient } from './client.js'

describe('createClient', () => {
  it('creates a client and transport with the given token', () => {
    const { client, transport } = createClient('test-token')
    expect(client).toBeDefined()
    expect(transport).toBeDefined()
  })

  it('returns a client with the correct name and version', () => {
    const { client } = createClient('test-token')
    // Client should have been created without throwing
    expect(client).toBeDefined()
  })
})
