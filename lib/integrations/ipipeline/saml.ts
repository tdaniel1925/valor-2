/**
 * iPipeline SAML 2.0 SSO Implementation
 *
 * Generates signed SAML assertions for SSO to iPipeline products
 * Based on Valor Insurance SAML2 Guide (GAID: 2717)
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
  private entityId: string;
  private environment: IPipelineEnvironment;

  constructor() {
    this.privateKey = process.env.IPIPELINE_SAML_PRIVATE_KEY || '';
    this.certificate = process.env.IPIPELINE_SAML_CERTIFICATE || '';
    this.entityId = process.env.IPIPELINE_ENTITY_ID || 'https://valorinsurance.com/saml/idp';
    this.environment = (process.env.IPIPELINE_ENVIRONMENT as IPipelineEnvironment) || 'uat';
  }

  /**
   * Check if SAML SSO is configured
   */
  isConfigured(): boolean {
    return !!(this.privateKey && this.certificate);
  }

  /**
   * Get the ACS URL for the current environment
   */
  getAcsUrl(): string {
    return IPIPELINE_ENDPOINTS.acs[this.environment];
  }

  /**
   * Get the RelayState URL for a specific product
   */
  getRelayState(product: IPipelineProduct): string {
    return IPIPELINE_ENDPOINTS.products[product][this.environment];
  }

  /**
   * Generate a SAML Response for iPipeline SSO
   */
  async generateSAMLResponse(request: IPipelineSSORequest): Promise<SAMLResponseData> {
    const now = new Date();
    const notBefore = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const notOnOrAfter = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    const responseId = `_${uuidv4()}`;
    const assertionId = `_${uuidv4()}`;
    const issueInstant = now.toISOString();

    const acsUrl = this.getAcsUrl();
    const relayState = this.getRelayState(request.product);
    const spEntityId = IPIPELINE_ENDPOINTS.spEntityId[this.environment];

    // Build ApplicationData XML for user profile
    const applicationData = this.buildApplicationData(request);

    // Build the SAML Response XML
    const samlXml = this.buildSAMLResponse({
      responseId,
      assertionId,
      issueInstant,
      notBefore: notBefore.toISOString(),
      notOnOrAfter: notOnOrAfter.toISOString(),
      acsUrl,
      spEntityId,
      userId: request.userId,
      applicationData,
    });

    // Sign the SAML Response
    const signedSaml = this.signSAMLResponse(samlXml, responseId);

    // Base64 encode the signed SAML
    const samlResponse = Buffer.from(signedSaml).toString('base64');

    return {
      samlResponse,
      relayState,
      acsUrl,
    };
  }

  /**
   * Build the ApplicationData XML for iGO user profile
   */
  private buildApplicationData(request: IPipelineSSORequest): string {
    const userData = [
      '<Data Name="UpdateUserProfile">TRUE</Data>',
      request.firstName ? `<Data Name="FirstName">${this.escapeXml(request.firstName)}</Data>` : '<Data Name="FirstName"/>',
      request.lastName ? `<Data Name="LastName">${this.escapeXml(request.lastName)}</Data>` : '<Data Name="LastName"/>',
      request.middleName ? `<Data Name="MiddleName">${this.escapeXml(request.middleName)}</Data>` : '<Data Name="MiddleName"/>',
      request.email ? `<Data Name="Email">${this.escapeXml(request.email)}</Data>` : '<Data Name="Email"/>',
      request.phone ? `<Data Name="Phone">${this.escapeXml(request.phone)}</Data>` : '<Data Name="Phone"/>',
      request.phone2 ? `<Data Name="Phone2">${this.escapeXml(request.phone2)}</Data>` : '<Data Name="Phone2"/>',
      request.fax ? `<Data Name="Fax">${this.escapeXml(request.fax)}</Data>` : '<Data Name="Fax"/>',
      request.address1 ? `<Data Name="Address1">${this.escapeXml(request.address1)}</Data>` : '<Data Name="Address1"/>',
      request.address2 ? `<Data Name="Address2">${this.escapeXml(request.address2)}</Data>` : '<Data Name="Address2"/>',
      request.city ? `<Data Name="City">${this.escapeXml(request.city)}</Data>` : '<Data Name="City"/>',
      request.state ? `<Data Name="State">${this.escapeXml(request.state)}</Data>` : '<Data Name="State"/>',
      request.zipCode ? `<Data Name="ZipCode">${this.escapeXml(request.zipCode)}</Data>` : '<Data Name="ZipCode"/>',
      request.country ? `<Data Name="Country">${this.escapeXml(request.country)}</Data>` : '<Data Name="Country"/>',
      request.brokerDealerNum ? `<Data Name="BrokerDealerNum">${this.escapeXml(request.brokerDealerNum)}</Data>` : '<Data Name="BrokerDealerNum"/>',
    ].join('');

    return `<![CDATA[<iGoApplicationData><UserData>${userData}</UserData><ClientData/></iGoApplicationData>]]>`;
  }

  /**
   * Build the SAML Response XML
   */
  private buildSAMLResponse(params: {
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
    return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    ID="${params.responseId}"
    Version="2.0"
    IssueInstant="${params.issueInstant}"
    Destination="${params.acsUrl}">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.entityId}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
      Version="2.0"
      ID="${params.assertionId}"
      IssueInstant="${params.issueInstant}">
    <saml:Issuer>${this.entityId}</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">${this.escapeXml(params.userId)}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="${params.notOnOrAfter}" Recipient="${params.acsUrl}"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="${params.notBefore}" NotOnOrAfter="${params.notOnOrAfter}">
      <saml:AudienceRestriction>
        <saml:Audience>${params.spEntityId}</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="${params.issueInstant}">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="CompanyIdentifier" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>${VALOR_COMPANY_IDENTIFIER}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="ChannelName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>${VALOR_CHANNEL_NAME}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="Action" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>CREATE</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="Groups" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>${VALOR_GROUPS}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="TimeoutURL" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue/>
      </saml:Attribute>
      <saml:Attribute Name="ApplicationData" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>${params.applicationData}</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;
  }

  /**
   * Sign the SAML Response using RSA-SHA256
   */
  private signSAMLResponse(xml: string, responseId: string): string {
    if (!this.privateKey || !this.certificate) {
      // SECURITY: Never return unsigned SAML responses in production
      throw new Error('SAML signing keys not configured - cannot generate secure SSO response');
    }

    // Create the signature
    const signedInfo = this.createSignedInfo(xml, responseId);
    const signature = this.createSignature(signedInfo);

    // Build the Signature element with SHA-256
    const signatureElement = `
  <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    <ds:SignedInfo>
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="#${responseId}">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
          <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>${this.computeDigest(xml)}</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>
    <ds:SignatureValue>${signature}</ds:SignatureValue>
    <ds:KeyInfo>
      <ds:X509Data>
        <ds:X509Certificate>${this.cleanCertificate(this.certificate)}</ds:X509Certificate>
      </ds:X509Data>
    </ds:KeyInfo>
  </ds:Signature>`;

    // Insert signature after Issuer element
    const issuerEndTag = '</saml:Issuer>';
    const insertPosition = xml.indexOf(issuerEndTag) + issuerEndTag.length;
    const signedXml = xml.slice(0, insertPosition) + signatureElement + xml.slice(insertPosition);

    return signedXml;
  }

  /**
   * Create the SignedInfo element for signing with SHA-256
   */
  private createSignedInfo(xml: string, responseId: string): string {
    return `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <ds:Reference URI="#${responseId}">
        <ds:Transforms>
          <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
          <ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
        </ds:Transforms>
        <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <ds:DigestValue>${this.computeDigest(xml)}</ds:DigestValue>
      </ds:Reference>
    </ds:SignedInfo>`;
  }

  /**
   * Compute SHA256 digest of XML
   */
  private computeDigest(xml: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(xml);
    return hash.digest('base64');
  }

  /**
   * Create RSA-SHA256 signature
   */
  private createSignature(signedInfo: string): string {
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signedInfo);
      return sign.sign(this.privateKey, 'base64');
    } catch (error) {
      console.error('Error creating SAML signature:', error);
      throw new Error('Failed to create SAML signature');
    }
  }

  /**
   * Clean certificate (remove headers/footers and whitespace)
   */
  private cleanCertificate(cert: string): string {
    return cert
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate IdP Metadata XML for sending to iPipeline
   */
  generateIdPMetadata(): string {
    const ssoUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://valorinsurance.com';

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    entityID="${this.entityId}">
  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${this.cleanCertificate(this.certificate)}</ds:X509Certificate>
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

// Export singleton instance
export const iPipelineSAMLClient = new IPipelineSAMLClient();
