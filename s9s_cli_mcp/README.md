# s9s-cli-mcp

Model Context Protocol (MCP) server that wraps the Severalnines ClusterControl `s9s` CLI.

## Project Structure

```
s9s-mcp/
├── README.md                    # Root project documentation
└── s9s_cli_mcp/               # Main MCP server directory
    ├── README.md               # This file
    ├── DOCKER.md              # Docker deployment guide
    ├── src/                   # TypeScript source code
    │   ├── index.ts           # Main MCP server
    │   └── runner.ts          # s9s CLI wrapper
    ├── dist/                  # Compiled JavaScript (generated)
    ├── scripts/               # Utility scripts
    │   └── selftest.ts        # Self-test script
    ├── package.json           # Dependencies and scripts
    ├── tsconfig.json          # TypeScript configuration
    ├── Dockerfile             # Docker image definition
    ├── docker-compose.yml     # Docker Compose setup
    ├── mcp-docker.json        # Docker MCP config examples
    ├── .env.example           # Environment template
    └── build-docker.sh        # Docker build script
```

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
- `cluster_list`: runs `s9s cluster --list --print-json` with optional flags: `{ flags?: string[] }`.
- `job_list`: runs `s9s job --list` with optional flags: `{ flags?: string[] }`.
- `node_list`: runs `s9s node --list --print-json` with optional flags: `{ flags?: string[] }`.
- `accounts_list`: runs `s9s account --list --cluster-id=ID --long` for the provided cluster:
  - params: `{ clusterId: string }`
- `backup_list`: runs `s9s backup --list --print-json` with optional cluster filtering and flags:
  - params: `{ clusterId?: string|number; flags?: string[] }`
  - Use `clusterId` to filter backups for specific cluster, omit to list all backups.
- `cluster_list_config`: runs `s9s cluster --cluster-id=X --list-config` to get cluster configuration:
  - params: `{ clusterId: string|number; flags?: string[] }`
- `job_log`: runs `s9s job --log --job-id=X` to get job logs:
  - params: `{ jobId: string|number }`

## Claude Desktop config example

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "s9s-cli-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "s9s_cli_mcp",
      "env": {
        "S9S_BIN": "/usr/bin/s9s",
        "CC_HOST": "127.0.0.1",
        "CC_PORT": "9501",
        "CC_USER": "admin",
        "CC_PASS": "changeme"
      }
    }
  }
}
```

For development with TypeScript:

```json
{
  "mcpServers": {
    "s9s-cli-mcp": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "src/index.ts"],
      "cwd": "s9s_cli_mcp"
    }
  }
}
```

## Docker Configuration Examples

### Using Docker with environment file

```json
{
  "mcpServers": {
    "s9s-cli-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env-file",
        "/absolute/path/to/your/s9s_cli_mcp/.env",
        "s9s-cli-mcp:ubuntu"
      ]
    }
  }
}
```

### Using Docker with inline environment variables

```json
{
  "mcpServers": {
    "s9s-cli-docker-inline": {
      "command": "docker",
      "args": [
        "run",
        "--rm", 
        "-i",
        "--network=host",
        "-e", "CC_HOST=your.clustercontrol.host",
        "-e", "CC_PORT=9501", 
        "-e", "CC_USER=your_username",
        "-e", "CC_PASS=your_password",
        "s9s-cli-mcp:ubuntu"
      ]
    }
  }
}
```

### VS Code MCP Configuration

For development in VS Code, add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "s9s-cli-docker-inline": {
      "command": "docker",
      "args": [
        "run",
        "--rm", 
        "-i",
        "--network=host",
        "-e", "CC_HOST=your.clustercontrol.host",
        "-e", "CC_PORT=9501", 
        "-e", "CC_USER=your_username",
        "-e", "CC_PASS=your_password",
        "s9s-cli-mcp:ubuntu"
      ]
    }
  }
}
```

## Safety notes

- All commands are executed directly (no shell) via `execa` to prevent shell injection.
- Command execution is limited to predefined s9s subcommands to avoid arbitrary command execution.
- JSON output is parsed and validated where applicable.
- Ensure environment variables and credentials are handled securely. Consider using keyfile authentication.
- When using Docker, sensitive environment variables are isolated within the container.

## License

MIT
