#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkFailedJobs() {
  console.log('🔍 Checking for failed jobs...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseBuffer = '';
  
  serverProcess.stdout.on('data', (data) => {
    responseBuffer += data.toString();
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

  console.log('📥 Initializing MCP connection...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test job_list tool with flags to show failed jobs
  const jobListRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "job_list",
      arguments: {
        flags: ["--long", "--print-json"]
      }
    }
  };

  console.log('📥 Requesting job list...');
  serverProcess.stdin.write(JSON.stringify(jobListRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Parse and display results
  const responses = responseBuffer.split('\n').filter(line => line.trim());
  
  for (const response of responses) {
    try {
      const parsed = JSON.parse(response);
      if (parsed.id === 2 && parsed.result) {
        console.log('📤 Job list response received');
        const content = parsed.result.content[0].text;
        
        // Try to parse the job data
        try {
          const jobData = JSON.parse(content);
          if (jobData.jobs) {
            const failedJobs = jobData.jobs.filter(job => 
              job.status === 'FAILED' || job.exit_code !== 0
            );
            
            if (failedJobs.length > 0) {
              console.log(`\n❌ Found ${failedJobs.length} failed job(s):`);
              failedJobs.forEach(job => {
                console.log(`  - Job ID: ${job.job_id}`);
                console.log(`    Title: ${job.title || 'N/A'}`);
                console.log(`    Status: ${job.status}`);
                console.log(`    Exit Code: ${job.exit_code}`);
                console.log(`    Created: ${job.created || 'N/A'}`);
                console.log('    ---');
              });
            } else {
              console.log('\n✅ No failed jobs found!');
            }
          } else {
            console.log('\n📋 Raw job list output:');
            console.log(content);
          }
        } catch (parseError) {
          console.log('\n📋 Job list output (non-JSON):');
          console.log(content);
        }
      }
    } catch (e) {
      // Ignore parsing errors for non-JSON responses
    }
  }

  serverProcess.kill();
  console.log('\n✅ Job check completed');
}

checkFailedJobs().catch(console.error);
