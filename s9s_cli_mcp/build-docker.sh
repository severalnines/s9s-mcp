#!/bin/bash

# Build script for s9s-cli-mcp Docker image

set -e

echo "🏗️  Building s9s-cli-mcp Docker image..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "📦 Building TypeScript code..."
    npm install
    npm run build
else
    echo "✅ TypeScript code already built"
fi

# Build Docker image
echo "🐳 Building Docker image..."
if docker build -t s9s-cli-mcp:latest .; then
    echo "✅ Docker image built successfully!"
    
    # Test the image
    echo "🧪 Testing the image..."
    if docker run --rm s9s-cli-mcp:latest node -e "console.log('✅ Image test passed')"; then
        echo "✅ Image test passed!"
    else
        echo "❌ Image test failed"
        exit 1
    fi
    
    echo ""
    echo "🎉 Build complete! Your Docker image is ready:"
    echo "   Image tag: s9s-cli-mcp:latest"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy .env.example to .env and configure your ClusterControl connection"
    echo "2. Test the image: docker run --rm --env-file .env s9s-cli-mcp:latest"
    echo "3. Use the provided mcp-docker.json for MCP client configuration"
    
else
    echo "❌ Docker build failed!"
    echo ""
    echo "🔧 Troubleshooting options:"
    echo "1. Check if Docker is running: docker --version"
    echo "2. Try the alternative Dockerfile: docker build -f Dockerfile.alternative -t s9s-cli-mcp:latest ."
    echo "3. Check network connectivity for s9s installation"
    exit 1
fi
