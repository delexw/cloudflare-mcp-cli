# cloudflare-mcp-cli

CLI wrapper for the [Cloudflare MCP server](https://github.com/cloudflare/mcp-server-cloudflare). Exposes the server's two tools — `search` and `execute` — as shell commands.

## Install

```bash
npm install -g cloudflare-mcp-cli
```

## Authentication

Tokens are stored in your OS keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service) via [`@napi-rs/keyring`](https://github.com/nicolo-ribaudo/keyring-node).

```bash
# Store token (one-time)
cloudflare-mcp config set-token <your-cloudflare-api-token>

# Remove stored token
cloudflare-mcp config delete-token
```

You can also pass a token per-command with `--token` or the `CLOUDFLARE_API_TOKEN` env var.

**Resolution order:** `--token` flag > `CLOUDFLARE_API_TOKEN` env var > OS keychain.

## Usage

### search

Search the Cloudflare OpenAPI spec (all `$ref`s pre-resolved inline).

```bash
cloudflare-mcp search 'async () => {
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
```

**Available in code:** `spec.paths` — a record of OpenAPI paths with fully resolved schemas.

### execute

Execute JavaScript code against the Cloudflare API.

```bash
# List zones
cloudflare-mcp execute 'async () => cloudflare.request({ method: "GET", path: "/zones" })'

# With account ID (required for multi-account tokens)
cloudflare-mcp execute -a <account-id> 'async () => cloudflare.request({
  method: "GET",
  path: `/accounts/${accountId}/workers/scripts`
})'
```

**Available in code:**
- `cloudflare.request(options)` — make API calls
- `accountId` — the resolved account ID

### Options

```
-V, --version             output the version number
-t, --token <token>       Cloudflare API token
-h, --help                display help for command
```

### execute options

```
-a, --account-id <id>     Cloudflare account ID
```

## License

Apache-2.0
