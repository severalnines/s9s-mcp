#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBackupList() {
  console.log('🔌 Testing backup_list tool...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseBuffer = '';
  let responses = [];
  
  serverProcess.stdout.on('data', (data) => {
    const chunk = data.toString();
    responseBuffer += chunk;
    
    // Try to parse complete JSON responses
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop(); // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line.trim());
          responses.push(response);
        } catch (e) {
          // Ignore parsing errors for non-JSON lines
        }
      }
    }
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

  // List available tools
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };

  console.log('📥 Sending tools/list request...');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  serverProcess.kill();
  console.log('✅ Test completed');
  
  // Check if backup_list tool is in the list
  const toolsList = responses.find(r => r.id === 2);
  if (toolsList && toolsList.result && toolsList.result.tools) {
    const backupListTool = toolsList.result.tools.find(tool => tool.name === 'backup_list');
    if (backupListTool) {
      console.log('✅ backup_list tool found:', backupListTool.description);
      
      // List all available tools for reference
      console.log('\n📋 Available tools:');
      toolsList.result.tools.forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description}`);
      });
    } else {
      console.log('❌ backup_list tool not found in tools list');
    }
  } else {
    console.log('❌ Could not retrieve tools list');
  }
}

testBackupList().catch(console.error);
