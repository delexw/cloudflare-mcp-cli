#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Command } from 'commander'
import { createClient, callTool } from './client.js'
import { setToken, getToken, deleteToken } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))

export const program = new Command()

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version)
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
      const args: Record<string, string> = { code }
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

program
  .command('agent')
  .description('Print usage guide for AI agents')
  .action(() => {
    const guide = `# cloudflare-mcp-cli — Agent Usage Guide

cloudflare-mcp-cli is a CLI wrapper for the Cloudflare MCP server. It lets you search the Cloudflare OpenAPI spec and execute JavaScript code against the Cloudflare API.

## Authentication

Before using any command, ensure an API token is available via one of:
1. \`--token <token>\` flag on any command
2. \`CLOUDFLARE_API_TOKEN\` environment variable
3. Stored token: \`cloudflare-mcp-cli config set-token <token>\`

## Workflow

Always follow this two-step workflow:

### Step 1: Search for the right API endpoint
\`\`\`
cloudflare-mcp-cli search '<async arrow function>'
\`\`\`
The search function has access to a \`spec\` object (the full Cloudflare OpenAPI spec with all $refs resolved).

Examples:
  # Find endpoints by product tag
  cloudflare-mcp-cli search 'async () => {
    const results = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (op.tags?.some(t => t.toLowerCase() === "workers")) {
          results.push({ method: method.toUpperCase(), path, summary: op.summary });
        }
      }
    }
    return results;
  }'

  # Get request body schema for an endpoint
  cloudflare-mcp-cli search 'async () => {
    const op = spec.paths["/accounts/{account_id}/d1/database"]?.post;
    return { summary: op?.summary, requestBody: op?.requestBody };
  }'

  # Get endpoint parameters
  cloudflare-mcp-cli search 'async () => {
    const op = spec.paths["/accounts/{account_id}/workers/scripts"]?.get;
    return op?.parameters;
  }'

### Step 2: Execute code against the Cloudflare API
\`\`\`
cloudflare-mcp-cli execute '<async arrow function>' [--account-id <id>]
\`\`\`
The execute function has access to:
- \`cloudflare.request(options)\` — make authenticated API calls
- \`accountId\` — the resolved Cloudflare account ID

The \`cloudflare.request()\` options:
  method:      "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path:        API path (e.g., "/accounts/{accountId}/workers/scripts")
  query?:      Query parameters object
  body?:       Request body (auto-serialized to JSON unless rawBody is true)
  contentType?: Custom Content-Type header
  rawBody?:    If true, sends body as-is without JSON.stringify

Examples:
  # List all zones
  cloudflare-mcp-cli execute 'async () => {
    return cloudflare.request({ method: "GET", path: "/zones" });
  }'

  # List Workers scripts
  cloudflare-mcp-cli execute 'async () => {
    return cloudflare.request({
      method: "GET",
      path: \\\`/accounts/\\\${accountId}/workers/scripts\\\`
    });
  }' --account-id <your-account-id>

## Tips for agents
- Always search first to discover the correct endpoint path and required parameters.
- Use --account-id when the token has access to multiple accounts.
- The code argument must be a single async arrow function that returns a value.
- Quote the code argument carefully — use single quotes around the function and double quotes inside.`

    console.log(guide)
  })

export function resolveTokenFromOpts(opts: { token?: string }): string {
  return resolveToken(opts)
}

// Only parse when run directly (not imported by tests)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('/index.js') ||
  process.argv[1].endsWith('/cloudflare-mcp-cli')
)
if (isDirectRun) {
  program.parse()
}
