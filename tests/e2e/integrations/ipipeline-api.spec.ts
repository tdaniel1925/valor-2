import { test, expect } from '@playwright/test';

/**
 * iPipeline API Endpoint Tests
 *
 * Tests the /api/integrations/ipipeline/sso endpoint
 */

test.describe('iPipeline SSO API Endpoint', () => {
  const validRequest = {
    userId: 'test-user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    phone: '555-1234',
    product: 'igo',
  };

  test('should return successful SAML response for iGO', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('samlResponse');
    expect(data).toHaveProperty('relayState');
    expect(data).toHaveProperty('acsUrl');

    // SAML response should be base64 encoded
    expect(data.samlResponse).toBeTruthy();
    expect(data.samlResponse.length).toBeGreaterThan(100);

    // ACS URL should be iPipeline's SAML endpoint
    expect(data.acsUrl).toContain('ipipeline.com');
    expect(data.acsUrl).toContain('ACS.saml2');

    // Relay state should be iPipeline product URL
    expect(data.relayState).toContain('ipipeline.com');
  });

  test('should return successful SAML response for all products', async ({ request }) => {
    const products = ['igo', 'lifepipe', 'xrae', 'formspipe', 'productinfo'];

    for (const product of products) {
      const response = await request.post('/api/integrations/ipipeline/sso', {
        data: {
          ...validRequest,
          product,
        },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.samlResponse).toBeTruthy();
      expect(data.acsUrl).toContain('ipipeline.com');
      expect(data.relayState).toContain('ipipeline.com');
    }
  });

  test('should include all required user data in SAML response', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const data = await response.json();

    // Decode base64 SAML response
    const samlXml = Buffer.from(data.samlResponse, 'base64').toString('utf-8');

    // Check that user data is included in SAML
    expect(samlXml).toContain(validRequest.firstName);
    expect(samlXml).toContain(validRequest.lastName);
    expect(samlXml).toContain(validRequest.email);
    expect(samlXml).toContain(validRequest.userId);
  });

  test('should include proper SAML structure', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const data = await response.json();
    const samlXml = Buffer.from(data.samlResponse, 'base64').toString('utf-8');

    // Check SAML structure
    expect(samlXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(samlXml).toContain('<samlp:Response');
    expect(samlXml).toContain('<saml:Assertion');
    expect(samlXml).toContain('<ds:Signature');
    expect(samlXml).toContain('<samlp:Status');
    expect(samlXml).toContain('urn:oasis:names:tc:SAML:2.0:status:Success');

    // Check entity ID
    expect(samlXml).toContain('https://valorinsurance.com/saml/idp');

    // Check iPipeline-specific attributes
    expect(samlXml).toContain('CompanyIdentifier');
    expect(samlXml).toContain('ChannelName');
    expect(samlXml).toContain('ApplicationData');
  });

  test('should include valid RSA-SHA256 signature', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const data = await response.json();
    const samlXml = Buffer.from(data.samlResponse, 'base64').toString('utf-8');

    // Check signature elements
    expect(samlXml).toContain('<ds:SignatureValue>');
    expect(samlXml).toContain('</ds:SignatureValue>');
    expect(samlXml).toContain('<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"');
    expect(samlXml).toContain('<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"');

    // Signature value should be base64 encoded and have reasonable length
    const signatureMatch = samlXml.match(/<ds:SignatureValue>(.*?)<\/ds:SignatureValue>/s);
    expect(signatureMatch).toBeTruthy();

    if (signatureMatch) {
      const signatureValue = signatureMatch[1].trim();
      expect(signatureValue.length).toBeGreaterThan(100); // RSA signatures are typically 256+ bytes
    }
  });

  test('should handle missing required fields', async ({ request }) => {
    const invalidRequests = [
      { ...validRequest, userId: undefined },
      { ...validRequest, firstName: undefined },
      { ...validRequest, lastName: undefined },
      { ...validRequest, email: undefined },
      { ...validRequest, product: undefined },
    ];

    for (const invalidRequest of invalidRequests) {
      const response = await request.post('/api/integrations/ipipeline/sso', {
        data: invalidRequest,
      });

      // Should return 400 or 500 error
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('should handle invalid product name', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: {
        ...validRequest,
        product: 'invalid-product',
      },
    });

    // Should handle gracefully - either reject or use default
    const status = response.status();
    expect(status === 400 || status === 200).toBeTruthy();
  });

  test('should handle optional user fields gracefully', async ({ request }) => {
    const minimalRequest = {
      userId: 'test-user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      product: 'igo',
      // phone, address1, city, state, zipCode are optional
    };

    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: minimalRequest,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.samlResponse).toBeTruthy();
  });

  test('should return different relay states for different products', async ({ request }) => {
    const products = ['igo', 'lifepipe', 'xrae', 'formspipe', 'productinfo'];
    const relayStates = new Set<string>();

    for (const product of products) {
      const response = await request.post('/api/integrations/ipipeline/sso', {
        data: {
          ...validRequest,
          product,
        },
      });

      const data = await response.json();
      relayStates.add(data.relayState);
    }

    // Each product should have a unique relay state
    expect(relayStates.size).toBe(products.length);
  });

  test('should use correct ACS URL for environment', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const data = await response.json();

    // Should use UAT environment in development
    expect(data.acsUrl).toContain('federate-uat.ipipeline.com');
  });

  test('should generate unique SAML IDs for each request', async ({ request }) => {
    const response1 = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });
    const response2 = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const data1 = await response1.json();
    const data2 = await response2.json();

    const saml1 = Buffer.from(data1.samlResponse, 'base64').toString('utf-8');
    const saml2 = Buffer.from(data2.samlResponse, 'base64').toString('utf-8');

    // Extract Response IDs
    const id1Match = saml1.match(/ID="([^"]+)"/);
    const id2Match = saml2.match(/ID="([^"]+)"/);

    expect(id1Match).toBeTruthy();
    expect(id2Match).toBeTruthy();

    // IDs should be different
    if (id1Match && id2Match) {
      expect(id1Match[1]).not.toBe(id2Match[1]);
    }
  });

  test('should include valid timestamps in SAML', async ({ request }) => {
    const beforeRequest = new Date();

    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const afterRequest = new Date();

    const data = await response.json();
    const samlXml = Buffer.from(data.samlResponse, 'base64').toString('utf-8');

    // Extract IssueInstant timestamp
    const issueInstantMatch = samlXml.match(/IssueInstant="([^"]+)"/);
    expect(issueInstantMatch).toBeTruthy();

    if (issueInstantMatch) {
      const issueInstant = new Date(issueInstantMatch[1]);

      // IssueInstant should be between before and after request
      expect(issueInstant.getTime()).toBeGreaterThanOrEqual(beforeRequest.getTime() - 1000);
      expect(issueInstant.getTime()).toBeLessThanOrEqual(afterRequest.getTime() + 1000);
    }

    // Check NotBefore and NotOnOrAfter are present
    expect(samlXml).toMatch(/NotBefore="[^"]+"/);
    expect(samlXml).toMatch(/NotOnOrAfter="[^"]+"/);
  });

  test('should handle concurrent requests', async ({ request }) => {
    // Send 5 requests concurrently
    const requests = Array(5).fill(null).map((_, index) =>
      request.post('/api/integrations/ipipeline/sso', {
        data: {
          ...validRequest,
          userId: `test-user-${index}`,
        },
      })
    );

    const responses = await Promise.all(requests);

    // All should succeed
    for (const response of responses) {
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.samlResponse).toBeTruthy();
    }
  });

  test('should include proper iPipeline attributes', async ({ request }) => {
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: validRequest,
    });

    const data = await response.json();
    const samlXml = Buffer.from(data.samlResponse, 'base64').toString('utf-8');

    // Check for required iPipeline SAML attributes
    expect(samlXml).toContain('CompanyIdentifier');
    expect(samlXml).toContain('2717'); // GAID

    expect(samlXml).toContain('ChannelName');
    expect(samlXml).toContain('VAL'); // Channel

    expect(samlXml).toContain('Action');
    expect(samlXml).toContain('CREATE');

    expect(samlXml).toContain('Groups');
    expect(samlXml).toContain('02717-UsersGroup');

    expect(samlXml).toContain('ApplicationData');
    expect(samlXml).toContain('iGoApplicationData');
  });
});
