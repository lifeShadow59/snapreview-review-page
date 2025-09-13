#!/usr/bin/env node

/**
 * Test script for auto-feedback generation system
 * 
 * This script tests the auto-feedback generation system by:
 * 1. Checking the API endpoint availability
 * 2. Triggering a test run
 * 3. Verifying the results
 * 
 * Usage: node test-auto-feedback.js
 */

const https = require('https');
const http = require('http');

const config = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  cronToken: process.env.CRON_SECRET_TOKEN || '',
};

function makeRequest(url, options) {
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
    
    req.end();
  });
}

async function testAutoFeedbackSystem() {
  console.log('🧪 Testing Auto-Feedback Generation System');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check API availability
    console.log('\n1️⃣ Testing API availability...');
    const statusUrl = `${config.baseUrl}/api/cron/auto-feedback`;
    const statusResponse = await makeRequest(statusUrl, { method: 'GET' });
    
    if (statusResponse.statusCode === 200) {
      console.log('✅ API endpoint is available');
      console.log('📊 Status:', statusResponse.data.status);
      console.log('🏃 Currently running:', statusResponse.data.isRunning);
    } else {
      console.log('❌ API endpoint not available');
      console.log('📄 Response:', statusResponse.data);
      return;
    }
    
    // Test 2: Trigger auto-feedback generation
    console.log('\n2️⃣ Triggering auto-feedback generation...');
    const triggerUrl = `${config.baseUrl}/api/cron/auto-feedback`;
    const triggerOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add auth header if token is available
    if (config.cronToken) {
      triggerOptions.headers['Authorization'] = `Bearer ${config.cronToken}`;
    }
    
    const triggerResponse = await makeRequest(triggerUrl, triggerOptions);
    
    if (triggerResponse.statusCode === 200) {
      console.log('✅ Auto-feedback generation completed successfully');
      console.log('📈 Results:');
      console.log(`   🏢 Processed businesses: ${triggerResponse.data.processedBusinesses || 0}`);
      console.log(`   💬 Total feedbacks generated: ${triggerResponse.data.totalFeedbacksGenerated || 0}`);
      console.log(`   📝 Message: ${triggerResponse.data.message}`);
    } else if (triggerResponse.statusCode === 409) {
      console.log('⚠️ Auto-feedback generation is already running');
      console.log('📄 Response:', triggerResponse.data.message);
    } else {
      console.log('❌ Auto-feedback generation failed');
      console.log('📄 Response:', triggerResponse.data);
    }
    
    // Test 3: Alternative API endpoint
    console.log('\n3️⃣ Testing alternative API endpoint...');
    const altUrl = `${config.baseUrl}/api/auto-feedback-generator`;
    const altResponse = await makeRequest(altUrl, { method: 'POST' });
    
    if (altResponse.statusCode === 200) {
      console.log('✅ Alternative API endpoint works');
      console.log('📈 Results:');
      console.log(`   🏢 Processed businesses: ${altResponse.data.processedBusinesses || 0}`);
      console.log(`   💬 Total feedbacks generated: ${altResponse.data.totalFeedbacksGenerated || 0}`);
    } else {
      console.log('⚠️ Alternative API endpoint response:', altResponse.statusCode);
      console.log('📄 Response:', altResponse.data);
    }
    
    console.log('\n🎉 Auto-feedback system test completed!');
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your Next.js server is running on', config.baseUrl);
    }
  }
}

// Run the test
if (require.main === module) {
  testAutoFeedbackSystem();
}

module.exports = { testAutoFeedbackSystem };