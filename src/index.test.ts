import { describe, it, expect, vi, afterEach } from 'vitest'
import { program } from './index.js'

describe('CLI program', () => {
  it('reads name from package.json', () => {
    expect(program.name()).toBe('cloudflare-mcp-cli')
  })

  it('reads description from package.json', () => {
    expect(program.description()).toBe('CLI wrapper for the Cloudflare MCP server')
  })

  it('reads version from package.json', () => {
    const version = program.version()
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('has the --token global option', () => {
    const tokenOption = program.options.find((o) => o.long === '--token')
    expect(tokenOption).toBeDefined()
  })

  it('registers the config command', () => {
    const configCmd = program.commands.find((c) => c.name() === 'config')
    expect(configCmd).toBeDefined()
  })

  it('registers config set-token subcommand', () => {
    const configCmd = program.commands.find((c) => c.name() === 'config')
    const setTokenCmd = configCmd?.commands.find((c) => c.name() === 'set-token')
    expect(setTokenCmd).toBeDefined()
  })

  it('registers config delete-token subcommand', () => {
    const configCmd = program.commands.find((c) => c.name() === 'config')
    const deleteTokenCmd = configCmd?.commands.find((c) => c.name() === 'delete-token')
    expect(deleteTokenCmd).toBeDefined()
  })

  it('registers the search command', () => {
    const searchCmd = program.commands.find((c) => c.name() === 'search')
    expect(searchCmd).toBeDefined()
  })

  it('registers the execute command', () => {
    const executeCmd = program.commands.find((c) => c.name() === 'execute')
    expect(executeCmd).toBeDefined()
  })

  it('registers the agent command', () => {
    const agentCmd = program.commands.find((c) => c.name() === 'agent')
    expect(agentCmd).toBeDefined()
  })
})

describe('agent command', () => {
  it('prints the agent usage guide', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    program.parse(['node', 'cloudflare-mcp-cli', 'agent'])

    expect(consoleSpy).toHaveBeenCalled()
    const output = consoleSpy.mock.calls[0][0] as string
    expect(output).toContain('Agent Usage Guide')
    expect(output).toContain('Authentication')
    expect(output).toContain('cloudflare.request')
    expect(output).toContain('search')
    expect(output).toContain('execute')

    consoleSpy.mockRestore()
  })
})

describe('resolveToken', () => {
  const originalEnv = process.env.CLOUDFLARE_API_TOKEN

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.CLOUDFLARE_API_TOKEN = originalEnv
    } else {
      delete process.env.CLOUDFLARE_API_TOKEN
    }
  })

  it('resolves token from environment variable', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'env-token-test'
    const { resolveTokenFromOpts } = await import('./index.js')
    expect(resolveTokenFromOpts({ token: undefined })).toBe('env-token-test')
  })

  it('prefers explicit token over env var', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'env-token'
    const { resolveTokenFromOpts } = await import('./index.js')
    expect(resolveTokenFromOpts({ token: 'explicit-token' })).toBe('explicit-token')
  })
})
