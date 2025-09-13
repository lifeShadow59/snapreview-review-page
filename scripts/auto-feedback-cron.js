#!/usr/bin/env node

/**
 * Auto-feedback generation cron script
 * 
 * This script can be run as a standalone cron job to automatically generate
 * feedback for businesses that have less than 5 feedbacks per language.
 * 
 * Usage:
 * - Add to crontab: 0 2 * * * /path/to/node /path/to/scripts/auto-feedback-cron.js
 * - Run manually: node scripts/auto-feedback-cron.js
 * - Run with npm: npm run auto-feedback-cron
 * 
 * Environment variables required:
 * - DATABASE_URL or individual DB connection vars
 * - OPENROUTER_API_KEY (optional, will use templates if not available)
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Use environment variables or defaults
  apiUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  cronToken: process.env.CRON_SECRET_TOKEN || '',
  timeout: 300000, // 5 minutes timeout
};

/**
 * Make HTTP request to the auto-feedback API endpoint
 */
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Main function to run auto-feedback generation
 */
async function runAutoFeedbackGeneration() {
  console.log('🤖 Starting auto-feedback generation cron job...');
  console.log(`📅 ${new Date().toISOString()}`);
  
  try {
    const url = `${config.apiUrl}/api/cron/auto-feedback`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auto-Feedback-Cron/1.0'
      }
    };

    // Add authorization header if token is provided
    if (config.cronToken) {
      options.headers['Authorization'] = `Bearer ${config.cronToken}`;
    }

    console.log(`📡 Making request to: ${url}`);
    
    const response = await makeRequest(url, options);
    
    console.log(`📊 Response status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Auto-feedback generation completed successfully');
      console.log('📈 Results:', JSON.stringify(response.data, null, 2));
      
      // Log summary
      if (response.data.processedBusinesses) {
        console.log(`🏢 Processed businesses: ${response.data.processedBusinesses}`);
      }
      if (response.data.totalFeedbacksGenerated) {
        console.log(`💬 Total feedbacks generated: ${response.data.totalFeedbacksGenerated}`);
      }
      
      process.exit(0);
    } else {
      console.error('❌ Auto-feedback generation failed');
      console.error('📄 Response:', JSON.stringify(response.data, null, 2));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Error running auto-feedback generation:', error.message);
    
    // Log additional error details
    if (error.code) {
      console.error(`🔍 Error code: ${error.code}`);
    }
    
    process.exit(1);
  }
}

/**
 * Handle process signals for graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  runAutoFeedbackGeneration();
}

module.exports = { runAutoFeedbackGeneration };