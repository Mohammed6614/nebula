// Simple test to check if server starts
const { execSync } = require('child_process');

try {
  const result = execSync('timeout 10 npx tsx src/server.ts 2>&1', {
    cwd: '/home/mohammed/Documents/My_Workspace2/backend',
    encoding: 'utf-8',
    timeout: 15000
  });
  console.log('Server output:', result);
} catch (error) {
  console.log('Error or timeout:', error.stdout || error.message);
}
