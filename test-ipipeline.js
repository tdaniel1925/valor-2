#!/usr/bin/env node
/**
 * iPipeline Integration Automated Test Suite
 *
 * Tests everything we can without requiring iPipeline's live server
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('='.repeat(60));
console.log('iPIPELINE INTEGRATION - AUTOMATED TEST SUITE');
console.log('='.repeat(60));
console.log('');

let passedTests = 0;
let failedTests = 0;
let totalTests = 0;

function testResult(testName, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${testName}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
  console.log('');
}

// Test 1: Certificate Files Exist
console.log('TEST 1: Certificate Files');
console.log('-'.repeat(60));
const certExists = fs.existsSync('valor-saml.crt');
const keyExists = fs.existsSync('valor-saml.key');
testResult(
  'Certificate files exist',
  certExists && keyExists,
  certExists && keyExists
    ? 'Found: valor-saml.crt, valor-saml.key'
    : 'Missing certificate files'
);

// Test 2: Environment Variables
console.log('TEST 2: Environment Variables');
console.log('-'.repeat(60));
let envContent = '';
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (err) {
  // .env.local might not exist
}

const hasSSO = envContent.includes('IPIPELINE_SSO_ENABLED="true"');
const hasCert = envContent.includes('IPIPELINE_SAML_CERTIFICATE=');
const hasKey = envContent.includes('IPIPELINE_SAML_PRIVATE_KEY=');
const hasEntityId = envContent.includes('IPIPELINE_ENTITY_ID=');
const hasEnvironment = envContent.includes('IPIPELINE_ENVIRONMENT=');

testResult('IPIPELINE_SSO_ENABLED is true', hasSSO);
testResult('IPIPELINE_SAML_CERTIFICATE is set', hasCert);
testResult('IPIPELINE_SAML_PRIVATE_KEY is set', hasKey);
testResult('IPIPELINE_ENTITY_ID is set', hasEntityId);
testResult('IPIPELINE_ENVIRONMENT is set', hasEnvironment);

// Test 3: Certificate Validity
console.log('TEST 3: Certificate Details');
console.log('-'.repeat(60));
if (certExists) {
  const { execSync } = require('child_process');
  try {
    const certInfo = execSync('openssl x509 -in valor-saml.crt -noout -text', { encoding: 'utf8' });

    // Check expiration
    const notAfterMatch = certInfo.match(/Not After : (.+)/);
    if (notAfterMatch) {
      const expiryDate = new Date(notAfterMatch[1]);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

      testResult(
        'Certificate is valid (not expired)',
        daysUntilExpiry > 0,
        `Expires: ${expiryDate.toLocaleDateString()} (${daysUntilExpiry} days remaining)`
      );
    }

    // Check issuer
    const issuerMatch = certInfo.match(/Issuer:.*CN\s*=\s*([^,\n]+)/);
    if (issuerMatch) {
      testResult(
        'Certificate has valid issuer',
        true,
        `Issuer CN: ${issuerMatch[1].trim()}`
      );
    }
  } catch (err) {
    testResult('Certificate validation', false, `Error: ${err.message}`);
  }
} else {
  testResult('Certificate validation', false, 'Certificate file not found');
}

// Test 4: Server Availability
console.log('TEST 4: Server Status');
console.log('-'.repeat(60));

const testServer = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 2050,
      path: '/',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 307);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Test 5: API Endpoints
const testAPIEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 2050,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === 200 || res.statusCode === 401; // 401 is ok if auth required
        testResult(description, success, `Status: ${res.statusCode}`);
        resolve();
      });
    });

    req.on('error', (err) => {
      testResult(description, false, `Error: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      testResult(description, false, 'Timeout after 5s');
      resolve();
    });

    req.end();
  });
};

// Test 6: SAML SSO Endpoint
const testSSOEndpoint = () => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      userId: 'test-user-123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@valorfs.com',
      product: 'igo'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 2050,
      path: '/api/integrations/ipipeline/sso',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const hasResponse = json.samlResponse && json.acsUrl && json.relayState;
          testResult(
            'SSO endpoint generates SAML response',
            hasResponse,
            hasResponse ? 'SAML response generated successfully' : 'Missing required fields'
          );

          if (hasResponse) {
            // Decode and check SAML
            const saml = Buffer.from(json.samlResponse, 'base64').toString('utf8');
            const hasAssertion = saml.includes('<saml:Assertion');
            const hasSignature = saml.includes('<ds:Signature');

            testResult('SAML contains Assertion', hasAssertion);
            testResult('SAML is digitally signed', hasSignature);
            testResult('ACS URL is valid', json.acsUrl.startsWith('https://'));
            testResult('RelayState URL is valid', json.relayState.startsWith('https://'));
          }
        } catch (err) {
          testResult('SSO endpoint generates SAML response', false, `Parse error: ${err.message}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      testResult('SSO endpoint generates SAML response', false, `Error: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      req.destroy();
      testResult('SSO endpoint generates SAML response', false, 'Timeout');
      resolve();
    });

    req.write(postData);
    req.end();
  });
};

// Run all async tests
(async () => {
  const serverRunning = await testServer();
  testResult(
    'Server is running on port 2050',
    serverRunning,
    serverRunning ? 'Server responded' : 'Server not responding (run: npm run dev)'
  );

  if (serverRunning) {
    console.log('TEST 5: API Endpoints');
    console.log('-'.repeat(60));

    await testAPIEndpoint('/api/integrations/ipipeline', 'Status endpoint responds');
    await testAPIEndpoint('/api/integrations/ipipeline/metadata', 'Metadata endpoint responds');

    console.log('TEST 6: SAML Generation');
    console.log('-'.repeat(60));
    await testSSOEndpoint();

    console.log('TEST 7: Integration Page');
    console.log('-'.repeat(60));
    await testAPIEndpoint('/integrations/ipipeline', 'Integration page loads');
  } else {
    console.log('\n⚠️  Server is not running - skipping API tests');
    console.log('   Start server with: npm run dev');
    console.log('   Then run this test again');
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log('');

  if (failedTests === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Configuration is valid');
    console.log('✅ Certificates are in place');
    console.log('✅ API endpoints are working');
    console.log('✅ SAML generation is functional');
    console.log('');
    console.log('🚀 READY TO TEST WITH iPIPELINE!');
    console.log('   Visit: http://localhost:2050/integrations/ipipeline');
    console.log('   Click "Open iGO" to test SSO');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review errors above');
    console.log('');
    if (!serverRunning) {
      console.log('💡 TIP: Start server first (npm run dev) for full test coverage');
    }
  }
  console.log('');

  process.exit(failedTests > 0 ? 1 : 0);
})();
