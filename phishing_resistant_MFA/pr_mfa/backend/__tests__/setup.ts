// phishing_resistant_MFA/pr_mfa/backend/__tests__/setup.ts

import { exec } from 'child_process';
import fetch from 'node-fetch';

// Global beforeAll to ensure server is running
// @ts-ignore - Jest adds these globals
global.beforeAll(async () => {
  // Check if server is already running
  try {
    await fetch('http://localhost:3001/hello');
    console.log('Server is already running');
  } catch (error) {
    console.log('Starting server for tests...');
    // Start the server in a separate process
    // This is non-blocking, the server will run in the background
    exec('cd ../.. && npm run start:backend');
    
    // Wait for server to start
    let serverStarted = false;
    const maxRetries = 10;
    let retries = 0;
    
    while (!serverStarted && retries < maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await fetch('http://localhost:3001/hello');
        serverStarted = true;
        console.log('Server started successfully');
      } catch (error) {
        retries++;
        console.log(`Waiting for server to start (attempt ${retries}/${maxRetries})...`);
      }
    }
    
    if (!serverStarted) {
      throw new Error('Failed to start the server after multiple attempts');
    }
  }
});

// Add a bit of delay between tests for API rate limiting
// @ts-ignore - Jest adds these globals
global.beforeEach(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});