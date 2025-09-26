#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCP() {
  console.log('🔌 Starting MCP server test...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseBuffer = '';
  
  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    console.log('📤 Server response:', data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('❌ Server error:', data.toString());
  });

  // Initialize MCP
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };

  console.log('📥 Sending initialize request...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait a bit for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test cluster_list tool
  const clusterListRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "cluster_list",
      arguments: {}
    }
  };

  console.log('📥 Sending cluster_list request...');
  serverProcess.stdin.write(JSON.stringify(clusterListRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  serverProcess.kill();
  console.log('✅ Test completed');
}

testMCP().catch(console.error);
