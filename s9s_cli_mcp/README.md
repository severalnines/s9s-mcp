# s9s-cli-mcp

Model Context Protocol (MCP) server that wraps the Severalnines ClusterControl `s9s` CLI.

## Quick start

- Requirements: Node.js >= 18, `s9s` CLI installed and accessible in PATH or via `S9S_BIN`.
- Install dependencies, configure environment, then run the server.
- **Alternative**: Use Docker for containerized deployment (see [DOCKER.md](DOCKER.md))

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and set variables to match your ClusterControl environment.

- `S9S_BIN`: path to the `s9s` binary (optional, defaults to `s9s`)
- `S9S_HOME`, `CC_HOST`, `CC_PORT`, `CC_USER`, `CC_PASS`, `CC_KEYFILE`

### Self-test (no MCP, just CLI)

Runs `s9s --version` and `s9s --help` via our runner.

```bash
npm run selftest
```

### Run as MCP (stdio)

This server uses stdio transport. A client (e.g., Claude Desktop or MCP Inspector) should launch it.

```bash
npm run build
npm start
```

It will wait for MCP JSON-RPC over stdio.

## Docker Deployment

For containerized deployment, see [DOCKER.md](DOCKER.md) for complete instructions.

Quick start with Docker:

```bash
# Build the image
./build-docker.sh

# Configure environment
cp .env.example .env
# Edit .env with your ClusterControl settings

# Use with MCP client (see mcp-docker.json example)
```

## Exposed tools

- `s9s_version`: returns `s9s --version`.
- `s9s_help`: returns `s9s --help`.
- `cluster_list`: runs `s9s cluster --list` with optional flags: `{ flags?: string[] }`.
- `job_list`: runs `s9s job --list` with optional flags: `{ flags?: string[] }`.
- `s9s_exec`: generic executor (whitelist: `cluster`, `job`, `task`, `server`):
  - params: `{ subcommand: string; args?: string[]; timeoutSeconds?: number }`
  - returns JSON with `{ stdout, stderr, exitCode }`.

## Claude Desktop config example

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "s9s-cli-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "S9S_BIN": "/usr/bin/s9s",
        "CC_HOST": "127.0.0.1",
        "CC_USER": "admin",
        "CC_PASS": "changeme"
      }
    }
  }
}
```

Or, for development:

```json
{
  "mcpServers": {
    "s9s-cli-mcp": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "src/index.ts"]
    }
  }
}
```

## Safety notes

- `s9s_exec` is limited to the subcommands `cluster`, `job`, `task`, `server` to avoid arbitrary shell execution.
- All commands are executed directly (no shell) via `execa`.
- Ensure environment variables and credentials are handled securely. Consider using keyfile authentication.

## License

MIT
