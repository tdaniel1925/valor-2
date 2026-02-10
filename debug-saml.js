#!/usr/bin/env node
/**
 * SAML Debug Tool
 * Generates a SAML response and decodes it for inspection
 */

const http = require('http');

console.log('='.repeat(60));
console.log('SAML DEBUG TOOL - Generating & Decoding SAML Response');
console.log('='.repeat(60));
console.log('');

const postData = JSON.stringify({
  userId: 'debug-user-123',
  firstName: 'Debug',
  lastName: 'User',
  email: 'debug@valorfs.com',
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
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);

      if (!json.success) {
        console.log('❌ SAML generation failed:', json.error);
        process.exit(1);
      }

      console.log('✅ SAML Response Generated Successfully');
      console.log('');
      console.log('ACS URL:', json.acsUrl);
      console.log('RelayState:', json.relayState);
      console.log('');

      // Decode SAML
      const samlXml = Buffer.from(json.samlResponse, 'base64').toString('utf8');

      console.log('='.repeat(60));
      console.log('DECODED SAML ASSERTION');
      console.log('='.repeat(60));
      console.log('');
      console.log(samlXml);
      console.log('');

      // Extract key information
      console.log('='.repeat(60));
      console.log('KEY SAML ATTRIBUTES');
      console.log('='.repeat(60));
      console.log('');

      // Extract Issuer
      const issuerMatch = samlXml.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/);
      if (issuerMatch) {
        console.log('✅ Issuer (Entity ID):', issuerMatch[1]);
      }

      // Extract NameID
      const nameIdMatch = samlXml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
      if (nameIdMatch) {
        console.log('✅ NameID (User ID):', nameIdMatch[1]);
      }

      // Extract CompanyIdentifier
      const companyMatch = samlXml.match(/<saml:Attribute Name="CompanyIdentifier"[^>]*>[\s\S]*?<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/);
      if (companyMatch) {
        console.log('✅ Company Identifier:', companyMatch[1]);
      }

      // Extract ChannelName
      const channelMatch = samlXml.match(/<saml:Attribute Name="ChannelName"[^>]*>[\s\S]*?<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/);
      if (channelMatch) {
        console.log('✅ Channel Name:', channelMatch[1]);
      }

      // Extract Groups
      const groupsMatch = samlXml.match(/<saml:Attribute Name="Groups"[^>]*>[\s\S]*?<saml:AttributeValue>([^<]+)<\/saml:AttributeValue>/);
      if (groupsMatch) {
        console.log('✅ Groups:', groupsMatch[1]);
      }

      // Check for Signature
      const hasSignature = samlXml.includes('<ds:Signature');
      console.log(hasSignature ? '✅ Digitally Signed: YES' : '❌ Digitally Signed: NO');

      // Extract Response ID
      const responseIdMatch = samlXml.match(/ID="([^"]+)"/);
      if (responseIdMatch) {
        console.log('✅ Response ID:', responseIdMatch[1]);
      }

      // Extract timestamps
      const issueInstantMatch = samlXml.match(/IssueInstant="([^"]+)"/);
      if (issueInstantMatch) {
        console.log('✅ Issue Instant:', issueInstantMatch[1]);
      }

      const notBeforeMatch = samlXml.match(/NotBefore="([^"]+)"/);
      const notOnOrAfterMatch = samlXml.match(/NotOnOrAfter="([^"]+)"/);
      if (notBeforeMatch && notOnOrAfterMatch) {
        console.log('✅ Valid Time Window:');
        console.log('   Not Before:', notBeforeMatch[1]);
        console.log('   Not On Or After:', notOnOrAfterMatch[1]);

        const notBefore = new Date(notBeforeMatch[1]);
        const notOnOrAfter = new Date(notOnOrAfterMatch[1]);
        const now = new Date();

        const validWindow = now >= notBefore && now <= notOnOrAfter;
        console.log(validWindow ? '   ✅ Current time is within valid window' : '   ❌ Current time is OUTSIDE valid window');
      }

      console.log('');
      console.log('='.repeat(60));
      console.log('DIAGNOSIS');
      console.log('='.repeat(60));
      console.log('');

      const issues = [];

      if (!hasSignature) {
        issues.push('❌ SAML response is not digitally signed');
      }

      if (!companyMatch || companyMatch[1] !== '2717') {
        issues.push('❌ Company Identifier is not 2717');
      }

      if (!channelMatch || channelMatch[1] !== 'VAL') {
        issues.push('❌ Channel Name is not VAL');
      }

      if (issues.length === 0) {
        console.log('✅ SAML structure looks correct!');
        console.log('');
        console.log('⚠️  If iPipeline is still rejecting this SAML:');
        console.log('');
        console.log('1. ASK iPIPELINE: "Have you loaded our metadata into UAT yet?"');
        console.log('   - This is the #1 most common issue');
        console.log('   - They need to manually upload the metadata XML file');
        console.log('   - It can take 10-30 minutes to propagate');
        console.log('');
        console.log('2. ASK iPIPELINE: "Can you check your UAT logs for reference #RSAQBQFS?"');
        console.log('   - They can see exactly why the SAML was rejected');
        console.log('   - Common reasons: cert mismatch, timing issue, missing attributes');
        console.log('');
        console.log('3. VERIFY: Entity ID matches what they configured');
        console.log('   - Our Entity ID: https://valorinsurance.com/saml/idp');
        console.log('   - Ask them to confirm this matches their config');
      } else {
        console.log('⚠️  POTENTIAL ISSUES FOUND:');
        console.log('');
        issues.forEach(issue => console.log(issue));
      }

      console.log('');

    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Request failed:', err.message);
  console.log('');
  console.log('Make sure the server is running: npm run dev');
  process.exit(1);
});

req.write(postData);
req.end();
