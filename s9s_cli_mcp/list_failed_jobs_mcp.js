#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function listFailedJobsViaMCP() {
  console.log('🔍 Listing failed jobs via MCP...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  
  serverProcess.stdout.on('data', (data) => {
    responseData += data.toString();
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
        name: "failed-jobs-client",
        version: "1.0.0"
      }
    }
  };

  console.log('📥 Initializing MCP connection...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Request job list via MCP
  const jobListRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "job_list",
      arguments: {
        flags: ["--long"]
      }
    }
  };

  console.log('📥 Requesting job list via MCP...');
  serverProcess.stdin.write(JSON.stringify(jobListRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get job log for the specific failed job
  const jobLogRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "job_log",
      arguments: {
        jobId: "6180"
      }
    }
  };

  console.log('📥 Requesting failed job log (ID: 6180) via MCP...');
  serverProcess.stdin.write(JSON.stringify(jobLogRequest) + '\n');

  // Wait for job log response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Parse responses
  const responses = responseData.split('\n').filter(line => line.trim());
  
  console.log('\n📤 MCP Responses:');
  console.log('==================');
  
  for (const response of responses) {
    try {
      const parsed = JSON.parse(response);
      
      if (parsed.id === 1) {
        console.log('✅ MCP initialization successful');
      } 
      else if (parsed.id === 2 && parsed.result) {
        console.log('\n📋 Job List Response:');
        console.log('--------------------');
        const jobListOutput = parsed.result.content[0].text;
        
        // Filter and display failed/aborted jobs
        const lines = jobListOutput.split('\n');
        const failedJobs = lines.filter(line => 
          line.includes('FAILED') || line.includes('ABORTED')
        );
        
        if (failedJobs.length > 0) {
          console.log(`❌ Found ${failedJobs.length} failed/aborted jobs:`);
          failedJobs.forEach(job => {
            console.log(`  ${job.trim()}`);
          });
        } else {
          console.log('✅ No failed/aborted jobs found in recent jobs');
        }
      }
      else if (parsed.id === 3 && parsed.result) {
        console.log('\n📝 Failed Job Log (ID: 6180):');
        console.log('-----------------------------');
        const logOutput = parsed.result.content[0].text;
        console.log(logOutput);
      }
      else if (parsed.error) {
        console.log(`❌ MCP Error (ID: ${parsed.id}):`, parsed.error.message);
      }
    } catch (e) {
      // Skip non-JSON responses
    }
  }

  serverProcess.kill();
  console.log('\n✅ Failed jobs check completed via MCP');
}

listFailedJobsViaMCP().catch(console.error);
