import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))

const MCP_URL = 'https://mcp.cloudflare.com/mcp'

export function createClient(apiToken: string): {
  client: Client
  transport: StreamableHTTPClientTransport
} {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  })

  const client = new Client({
    name: pkg.name,
    version: pkg.version,
  })

  return { client, transport }
}

export async function callTool(
  client: Client,
  toolName: string,
  args: Record<string, string>,
): Promise<string> {
  const result = await client.callTool({ name: toolName, arguments: args })

  const textContent = result.content as Array<{ type: string; text: string }>
  const text = textContent
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n')

  if (result.isError) {
    throw new Error(text)
  }

  return text
}
