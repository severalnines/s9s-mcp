# Docker Setup for s9s-cli-mcp

This guide explains how to build and run the s9s-cli-mcp server using Docker.

## Prerequisites

- Docker installed on your system
- Access to a ClusterControl server
- s9s CLI credentials

## Building the Docker Image

### 1. Build the TypeScript code first

```bash
cd s9s_cli_mcp
npm install
npm run build
```

### 2. Choose your Dockerfile approach
Don't mind the --platform linux/amd64 flag if you're on amd64, it's just to ensure compatibility on ARM machines.

#### Option A: Standard Dockerfile (downloads s9s during build)
```bash
docker build -t s9s-cli-mcp:latest --platform linux/amd64 .
```

#### Option B: Alternative Dockerfile (copy s9s from host)
If you have s9s already installed on your host system:

```bash
# Copy s9s binary to current directory
cp $(which s9s) ./s9s

# Build with alternative Dockerfile
docker build -f Dockerfile.alternative -t s9s-cli-mcp:latest --platform linux/amd64 .
```

#### Option C: Manual s9s installation
If automatic installation fails, you can install s9s manually:

```bash
# Build base image without s9s
docker build --target base -t s9s-cli-mcp:base --platform linux/amd64 .

# Run container and install s9s manually
docker run -it s9s-cli-mcp:base sh
# Inside container:
# wget -qO- https://severalnines.com/downloads/cmon/install-s9s-tools.sh | bash

# Commit the container with s9s installed
docker commit <container_id> s9s-cli-mcp:latest
```

## Configuration

### Environment Variables

The container expects the following environment variables for ClusterControl connection:

- `CC_HOST` - ClusterControl host (IP or hostname) - **REQUIRED**
- `CC_PORT` - ClusterControl port (default: 9501) - **OPTIONAL**
- `CC_USER` - ClusterControl username - **REQUIRED**
- `CC_PASS` - ClusterControl password - **REQUIRED**
- `CC_KEYFILE` - Path to private key file (alternative to password) - **OPTIONAL**
- `S9S_BIN` - Path to s9s binary (default: s9s) - **OPTIONAL**

### Using Environment File

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your ClusterControl credentials
```

## Running the Container

### Option 1: Using environment variables directly

```bash
docker run -d \
  --name s9s-mcp \
  -e CC_HOST=your.clustercontrol.host \
  -e CC_PORT=9501 \
  -e CC_USER=your_username \
  -e CC_PASS=your_password \
  s9s-cli-mcp:latest
```

### Option 2: Using environment file

```bash
docker run -d \
  --name s9s-mcp \
  --env-file .env \
  s9s-cli-mcp:latest
```

### Option 3: Interactive mode for testing

```bash
docker run -it \
  --env-file .env \
  s9s-cli-mcp:latest
```

## MCP Client Configuration

To use the dockerized MCP server with an MCP client, you'll need to configure the client to communicate with the container via stdio.

### Example mcp.json for VS Code

Create or update your `.vscode/mcp.json` file:

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
        "/path/to/your/.env",
        "s9s-cli-mcp:latest"
      ],
      "description": "s9s CLI MCP server running in Docker"
    }
  }
}
```

### Example with environment variables in mcp.json

```json
{
  "mcpServers": {
    "s9s-cli-docker": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "CC_HOST=your.clustercontrol.host",
        "-e", "CC_PORT=9501",
        "-e", "CC_USER=your_username",
        "-e", "CC_PASS=your_password",
        "s9s-cli-mcp:latest"
      ],
      "description": "s9s CLI MCP server running in Docker"
    }
  }
}
```

## Docker Compose (Alternative)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  s9s-mcp:
    build: .
    container_name: s9s-mcp
    env_file:
      - .env
    restart: unless-stopped
    stdin_open: true  # Keep stdin open for MCP communication
    tty: true        # Allocate a pseudo-TTY
```

Run with:

```bash
docker-compose up -d
```

## Troubleshooting

### s9s Installation Issues

If the Docker build fails during s9s installation:

1. **Network issues**: Ensure your Docker daemon can access external networks
2. **Alternative installation**: Use `Dockerfile.alternative` and copy s9s from host
3. **Manual verification**: Test s9s installation separately

```bash
# Test s9s installation manually
docker run -it --rm alpine:latest sh
# Inside container:
apk add --no-cache bash wget
wget -qO- https://severalnines.com/downloads/cmon/install-s9s-tools.sh | bash
s9s --version
```

### Check container logs

```bash
docker logs s9s-mcp
```

### Test the container interactively

```bash
docker run -it --env-file .env s9s-cli-mcp:latest sh
```

### Verify s9s CLI inside container

```bash
docker exec -it s9s-mcp s9s --version
```

### Test MCP server manually

```bash
# Run container interactively and test MCP tools
docker run -it --env-file .env s9s-cli-mcp:latest

# In another terminal, you can attach to test
docker exec -it s9s-mcp sh
```

## Security Considerations

1. **Never commit `.env` files** with real credentials to version control
2. Use Docker secrets or a secure vault for production credentials
3. The container runs as a non-root user (`s9s:s9s`) for security
4. Consider using `CC_KEYFILE` instead of `CC_PASS` for authentication

## Image Size Optimization

The image uses `node:20-alpine` base to keep the size minimal. Current features:

- Multi-stage build to include only production dependencies
- Non-root user for security
- Health check included
- Optimized layer caching

## Production Deployment

For production environments, consider:

1. Using a container registry to store your built images
2. Setting up proper logging and monitoring
3. Using Kubernetes or Docker Swarm for orchestration
4. Implementing proper secret management
5. Setting up automated builds with CI/CD

## Available MCP Tools

The containerized server provides the same MCP tools as the local version:

- `s9s_version` - Get s9s version information
- `s9s_help` - Get s9s help information  
- `cluster_list` - List ClusterControl clusters
- `job_list` - List ClusterControl jobs
- `job_log` - Get job logs by ID
<!--- `s9s_exec` - Execute s9s subcommands -->

All tools respect the environment configuration and connection parameters.
