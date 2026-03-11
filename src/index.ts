#!/usr/bin/env node

import { Command } from 'commander'
import { createClient, callTool } from './client.js'
import { setToken, getToken, deleteToken } from './config.js'

const program = new Command()

program
  .name('cloudflare-mcp')
  .description('CLI wrapper for the Cloudflare MCP server')
  .version('1.0.0')
  .option('-t, --token <token>', 'Cloudflare API token (overrides stored token and CLOUDFLARE_API_TOKEN)')

function resolveToken(opts: { token?: string }): string {
  const token = opts.token || process.env.CLOUDFLARE_API_TOKEN || getToken()
  if (!token) {
    console.error(
      'Error: API token required. Use --token, set CLOUDFLARE_API_TOKEN, or run: cloudflare-mcp config set-token <token>'
    )
    process.exit(1)
  }
  return token
}

const config = program
  .command('config')
  .description('Manage stored configuration')

config
  .command('set-token')
  .description('Store API token in OS keychain')
  .argument('<token>', 'Cloudflare API token')
  .action((token: string) => {
    setToken(token)
    console.log('Token stored in OS keychain.')
  })

config
  .command('delete-token')
  .description('Remove stored API token from OS keychain')
  .action(() => {
    deleteToken()
    console.log('Token removed from OS keychain.')
  })

program
  .command('search')
  .description('Search the Cloudflare OpenAPI spec')
  .argument('<code>', 'JavaScript async arrow function to search the OpenAPI spec')
  .action(async (code: string) => {
    const token = resolveToken(program.opts())
    const { client, transport } = createClient(token)
    try {
      await client.connect(transport)
      const result = await callTool(client, 'search', { code })
      console.log(result)
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err)
      process.exit(1)
    } finally {
      await client.close()
    }
  })

program
  .command('execute')
  .description('Execute JavaScript code against the Cloudflare API')
  .argument('<code>', 'JavaScript async arrow function to execute')
  .option('-a, --account-id <id>', 'Cloudflare account ID (required for multi-account tokens)')
  .action(async (code: string, opts: { accountId?: string }) => {
    const token = resolveToken(program.opts())
    const { client, transport } = createClient(token)
    try {
      await client.connect(transport)
      const args: Record<string, unknown> = { code }
      if (opts.accountId) {
        args.account_id = opts.accountId
      }
      const result = await callTool(client, 'execute', args)
      console.log(result)
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err)
      process.exit(1)
    } finally {
      await client.close()
    }
  })

program.parse()
