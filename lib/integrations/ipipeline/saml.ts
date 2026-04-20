/**
 * iPipeline SAML 2.0 SSO Implementation
 *
 * Generates signed SAML assertions for SSO to iPipeline products
 * Based on Valor Insurance SAML2 Guide (GAID: 2717)
 *
 * Uses manual XML signing with pre-canonicalized XML.
 * The XML is built in Exclusive C14N canonical form so no
 * canonicalization library is needed — just Node's built-in crypto.
 *
 * This avoids:
 * - xml-crypto's DOM round-trip (re-serialization breaks PingFederate)
 * - Dynamic require() of internal modules (breaks Next.js bundler)
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
  IPipelineSSORequest,
  IPipelineProduct,
  IPipelineEnvironment,
  SAMLResponseData,
  IPIPELINE_ENDPOINTS,
} from './types';

// Valor-specific constants (assigned by iPipeline)
const VALOR_GAID = '2717';
const VALOR_COMPANY_IDENTIFIER = '2717';
const VALOR_CHANNEL_NAME = 'VAL';
const VALOR_GROUPS = '02717-UsersGroup';

/**
 * iPipeline SAML SSO Client
 */
export class IPipelineSAMLClient {
  private privateKey: string;
  private certificate: string;
  private certB64: string;
  private entityId: string;
  private environment: IPipelineEnvironment;

  constructor() {
    this.privateKey = this.formatPEM(process.env.IPIPELINE_SAML_PRIVATE_KEY || '', 'PRIVATE KEY');
    this.certificate = this.formatPEM(process.env.IPIPELINE_SAML_CERTIFICATE || '', 'CERTIFICATE');
    this.certB64 = this.cleanCertificate(this.certificate);
    this.entityId = process.env.IPIPELINE_ENTITY_ID || 'https://valorinsurance.com/saml/idp';
    this.environment = (process.env.IPIPELINE_ENVIRONMENT as IPipelineEnvironment) || 'uat';
  }

  private formatPEM(pem: string, type: string): string {
    if (!pem) return '';
    let formatted = pem.replace(/\\n/g, '\n');
    formatted = formatted.replace(/\s/g, '');
    const typeNoSpaces = type.replace(/\s/g, '');
    const beginMarker = `-----BEGIN${typeNoSpaces}-----`;
    const endMarker = `-----END${typeNoSpaces}-----`;
    let content = formatted;
    if (formatted.includes(beginMarker)) {
      content = formatted.split(beginMarker)[1]?.split(endMarker)[0] || '';
    }
    const lines = content.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
  }

  isConfigured(): boolean {
    return !!(this.privateKey && this.certificate);
  }

  getAcsUrl(): string {
    return IPIPELINE_ENDPOINTS.acs[this.environment];
  }

  getRelayState(product: IPipelineProduct): string {
    return IPIPELINE_ENDPOINTS.products[product][this.environment];
  }

  async generateSAMLResponse(request: IPipelineSSORequest): Promise<SAMLResponseData> {
    const now = new Date();
    const notBefore = new Date(now.getTime() - 5 * 60 * 1000);
    const notOnOrAfter = new Date(now.getTime() + 5 * 60 * 1000);

    const responseId = `_${uuidv4()}`;
    const assertionId = `_${uuidv4()}`;
    const issueInstant = now.toISOString();

    const acsUrl = this.getAcsUrl();
    const relayState = this.getRelayState(request.product);
    const spEntityId = IPIPELINE_ENDPOINTS.spEntityId[this.environment];
    const applicationData = this.buildApplicationData(request);

    // Build the unsigned Response in exc-c14n canonical form
    const canonicalResponse = this.buildCanonicalResponse({
      responseId, assertionId, issueInstant,
      notBefore: notBefore.toISOString(),
      notOnOrAfter: notOnOrAfter.toISOString(),
      acsUrl, spEntityId,
      userId: request.userId,
      applicationData,
    });

    // Sign it
    const signedSaml = this.sign(canonicalResponse, responseId);
    const samlResponse = Buffer.from(signedSaml).toString('base64');

    return { samlResponse, relayState, acsUrl };
  }

  /**
   * Build ApplicationData as escaped XML (not CDATA).
   */
  private buildApplicationData(request: IPipelineSSORequest): string {
    const userData = [
      '<Data Name="UpdateUserProfile">TRUE</Data>',
      request.firstName ? `<Data Name="FirstName">${this.escapeXml(request.firstName)}</Data>` : '<Data Name="FirstName"></Data>',
      request.lastName ? `<Data Name="LastName">${this.escapeXml(request.lastName)}</Data>` : '<Data Name="LastName"></Data>',
      request.middleName ? `<Data Name="MiddleName">${this.escapeXml(request.middleName)}</Data>` : '<Data Name="MiddleName"></Data>',
      request.email ? `<Data Name="Email">${this.escapeXml(request.email)}</Data>` : '<Data Name="Email"></Data>',
      request.phone ? `<Data Name="Phone">${this.escapeXml(request.phone)}</Data>` : '<Data Name="Phone"></Data>',
      request.phone2 ? `<Data Name="Phone2">${this.escapeXml(request.phone2)}</Data>` : '<Data Name="Phone2"></Data>',
      request.fax ? `<Data Name="Fax">${this.escapeXml(request.fax)}</Data>` : '<Data Name="Fax"></Data>',
      request.address1 ? `<Data Name="Address1">${this.escapeXml(request.address1)}</Data>` : '<Data Name="Address1"></Data>',
      request.address2 ? `<Data Name="Address2">${this.escapeXml(request.address2)}</Data>` : '<Data Name="Address2"></Data>',
      request.city ? `<Data Name="City">${this.escapeXml(request.city)}</Data>` : '<Data Name="City"></Data>',
      request.state ? `<Data Name="State">${this.escapeXml(request.state)}</Data>` : '<Data Name="State"></Data>',
      request.zipCode ? `<Data Name="ZipCode">${this.escapeXml(request.zipCode)}</Data>` : '<Data Name="ZipCode"></Data>',
      request.country ? `<Data Name="Country">${this.escapeXml(request.country)}</Data>` : '<Data Name="Country"></Data>',
      request.brokerDealerNum ? `<Data Name="BrokerDealerNum">${this.escapeXml(request.brokerDealerNum)}</Data>` : '<Data Name="BrokerDealerNum"></Data>',
    ].join('');

    return this.escapeXml(
      `<iGoApplicationData><UserData>${userData}</UserData><ClientData></ClientData></iGoApplicationData>`
    );
  }

  /**
   * Build the SAML Response in Exclusive C14N canonical form.
   *
   * Rules applied:
   * - No XML declaration
   * - No self-closing tags (use <tag></tag>)
   * - Attributes sorted: namespace decls first (by prefix), then regular attrs (alphabetically)
   * - Single-line, no whitespace between elements
   * - <!--SIGNATURE--> placeholder for Signature insertion
   */
  private buildCanonicalResponse(params: {
    responseId: string;
    assertionId: string;
    issueInstant: string;
    notBefore: string;
    notOnOrAfter: string;
    acsUrl: string;
    spEntityId: string;
    userId: string;
    applicationData: string;
  }): string {
    return (
      // Response: xmlns first, then attrs alphabetical (Destination, ID, IssueInstant, Version)
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Destination="${params.acsUrl}" ID="${params.responseId}" IssueInstant="${params.issueInstant}" Version="2.0">` +
      `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.entityId}</saml:Issuer>` +
      `<!--SIGNATURE-->` +
      `<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"></samlp:StatusCode></samlp:Status>` +
      // Assertion: xmlns first, then attrs alphabetical (ID, IssueInstant, Version)
      `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${params.assertionId}" IssueInstant="${params.issueInstant}" Version="2.0">` +
        `<saml:Issuer>${this.entityId}</saml:Issuer>` +
        `<saml:Subject>` +
          `<saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">${this.escapeXml(params.userId)}</saml:NameID>` +
          `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">` +
            `<saml:SubjectConfirmationData NotOnOrAfter="${params.notOnOrAfter}" Recipient="${params.acsUrl}"></saml:SubjectConfirmationData>` +
          `</saml:SubjectConfirmation>` +
        `</saml:Subject>` +
        `<saml:Conditions NotBefore="${params.notBefore}" NotOnOrAfter="${params.notOnOrAfter}">` +
          `<saml:AudienceRestriction>` +
            `<saml:Audience>${params.spEntityId}</saml:Audience>` +
          `</saml:AudienceRestriction>` +
        `</saml:Conditions>` +
        `<saml:AuthnStatement AuthnInstant="${params.issueInstant}">` +
          `<saml:AuthnContext>` +
            `<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>` +
          `</saml:AuthnContext>` +
        `</saml:AuthnStatement>` +
        `<saml:AttributeStatement>` +
          `<saml:Attribute Name="CompanyIdentifier" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue>${VALOR_COMPANY_IDENTIFIER}</saml:AttributeValue></saml:Attribute>` +
          `<saml:Attribute Name="ChannelName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue>${VALOR_CHANNEL_NAME}</saml:AttributeValue></saml:Attribute>` +
          `<saml:Attribute Name="Action" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue>CREATE</saml:AttributeValue></saml:Attribute>` +
          `<saml:Attribute Name="Groups" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue>${VALOR_GROUPS}</saml:AttributeValue></saml:Attribute>` +
          `<saml:Attribute Name="TimeoutURL" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue></saml:AttributeValue></saml:Attribute>` +
          `<saml:Attribute Name="ApplicationData" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic"><saml:AttributeValue>${params.applicationData}</saml:AttributeValue></saml:Attribute>` +
        `</saml:AttributeStatement>` +
      `</saml:Assertion>` +
      `</samlp:Response>`
    );
  }

  /**
   * Sign the SAML Response.
   *
   * The XML is already in exc-c14n canonical form, so we hash it directly
   * without any canonicalization library. Only uses Node's built-in crypto.
   */
  private sign(xml: string, responseId: string): string {
    if (!this.privateKey || !this.certificate) {
      throw new Error('SAML signing keys not configured');
    }

    // The canonical Response is the XML with the placeholder removed
    // (simulates enveloped-signature transform removing the Signature)
    const cleanXml = xml.replace('<!--SIGNATURE-->', '');
    const digest = crypto.createHash('sha256').update(cleanXml, 'utf8').digest('base64');

    // Build SignedInfo in canonical form (xmlns:ds on root, no self-closing tags, attrs sorted)
    const signedInfoCanonical =
      `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">` +
      `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></ds:CanonicalizationMethod>` +
      `<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod>` +
      `<ds:Reference URI="#${responseId}">` +
      `<ds:Transforms>` +
      `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform>` +
      `<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></ds:Transform>` +
      `</ds:Transforms>` +
      `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>` +
      `<ds:DigestValue>${digest}</ds:DigestValue>` +
      `</ds:Reference>` +
      `</ds:SignedInfo>`;

    // Sign the canonical SignedInfo
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signedInfoCanonical, 'utf8');
    const signatureValue = signer.sign(this.privateKey, 'base64');

    // Build the Signature block (SignedInfo inside inherits xmlns:ds from parent)
    const signedInfoInner = signedInfoCanonical.replace(` xmlns:ds="http://www.w3.org/2000/09/xmldsig#"`, '');
    const signatureBlock =
      `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">` +
      signedInfoInner +
      `<ds:SignatureValue>${signatureValue}</ds:SignatureValue>` +
      `<ds:KeyInfo>` +
      `<ds:X509Data>` +
      `<ds:X509Certificate>${this.certB64}</ds:X509Certificate>` +
      `</ds:X509Data>` +
      `</ds:KeyInfo>` +
      `</ds:Signature>`;

    return xml.replace('<!--SIGNATURE-->', signatureBlock);
  }

  private cleanCertificate(cert: string): string {
    return cert
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  generateIdPMetadata(): string {
    const ssoUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://valorinsurance.com';
    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    entityID="${this.entityId}">
  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${this.certB64}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleSignOnService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${ssoUrl}/api/integrations/ipipeline/sso"/>
  </md:IDPSSODescriptor>
  <md:Organization>
    <md:OrganizationName xml:lang="en">Valor Insurance</md:OrganizationName>
    <md:OrganizationDisplayName xml:lang="en">Valor Financial Specialists</md:OrganizationDisplayName>
    <md:OrganizationURL xml:lang="en">${ssoUrl}</md:OrganizationURL>
  </md:Organization>
  <md:ContactPerson contactType="technical">
    <md:Company>Valor Financial Specialists</md:Company>
    <md:EmailAddress>support@valorinsurance.com</md:EmailAddress>
  </md:ContactPerson>
</md:EntityDescriptor>`;
  }
}

export const iPipelineSAMLClient = new IPipelineSAMLClient();
