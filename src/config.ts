import { Entry } from '@napi-rs/keyring'

const SERVICE_NAME = 'cloudflare-mcp-cli'
const TOKEN_KEY = 'api-token'

export function setToken(token: string): void {
  const entry = new Entry(SERVICE_NAME, TOKEN_KEY)
  entry.setPassword(token)
}

export function getToken(): string | undefined {
  try {
    const entry = new Entry(SERVICE_NAME, TOKEN_KEY)
    const password = entry.getPassword()
    return password || undefined
  } catch {
    return undefined
  }
}

export function deleteToken(): void {
  try {
    const entry = new Entry(SERVICE_NAME, TOKEN_KEY)
    entry.deletePassword()
  } catch {
    // Already gone
  }
}
