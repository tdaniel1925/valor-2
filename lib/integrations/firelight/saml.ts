/**
 * FireLight SAML 2.0 IdP-initiated SSO.
 *
 * Valor is the IdP: we build a signed SAMLResponse carrying FireLight's required
 * claims plus the agent's data as a base64 ACORD Tx1228 (SSO_SESSION_INFO), and
 * POST it to FireLight's idp-initiatedsso.aspx endpoint.
 *
 * Signing reuses the proven manual Exclusive-C14N + Node-crypto approach from
 * lib/integrations/ipipeline/saml.ts (RSA-SHA256, enveloped signature, X509
 * KeyInfo) — no xml-crypto / DOM library, so it is bundler-safe. Only the
 * Response/Assertion body differs (FireLight claims vs iPipeline ApplicationData).
 *
 * All env reads are LAZY (inside methods) so importing this module never throws
 * at build time when keys are absent (see the lib/sso/jwt.ts lesson).
 *
 * Confirmed values (firelight/SSO-REQUIREMENTS.md): Issuer=VFS_Identifier,
 * ORGANIZATION_ID=3954, USER_ROLE=Agent, USER_RIGHTS=Full,
 * EXTERNAL_ROLE_CODE=VFS_Agent, Tx1228 CarrierCode=VFS.
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export type FireLightEnvironment = 'uat' | 'prod';

const ENDPOINTS: Record<FireLightEnvironment, string> = {
  uat: 'https://uat.firelighteapp.com/egapp/idp-initiatedsso.aspx',
  prod: 'https://www.firelighteapp.com/egapp/idp-initiatedsso.aspx',
};

// FireLight (Insurance Technologies) SAML claim URIs.
const CLAIM = {
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role', // USER_ROLE
  rights: 'http://schemas.insurancetechnologies.com/2010/01/identity/claims/rights', // USER_RIGHTS
  organizationId: 'http://schemas.insurancetechnologies.com/2010/01/identity/claims/organizationid',
  nameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/privatepersonalidentifier',
  externalRoleCode: 'http://schemas.insurancetechnologies.com/2010/01/identity/claims/externalrolecode',
  ssoSessionInfo: 'http://schemas.insurancetechnologies.com/2010/01/identity/claims/ssosessioninfo',
} as const;

export interface FireLightSSORequest {
  /** Stable unique key for this user (NAME_IDENTIFIER + Subject NameID). */
  nameId: string;
  fullName: string;
  email: string;
  /** Our stable per-agent producer id (apexContactId). */
  companyProducerId: string;
}

export interface FireLightSAMLResult {
  samlResponse: string; // base64
  endpoint: string;
  relayState: string;
}

export class FireLightSAMLClient {
  private env(): FireLightEnvironment {
    // SSO-specific to avoid clashing with the legacy REST FIRELIGHT_ENVIRONMENT.
    return (process.env.FIRELIGHT_SSO_ENVIRONMENT as FireLightEnvironment) === 'prod' ? 'prod' : 'uat';
  }

  /** Per-environment private key, falling back to a non-suffixed var. */
  private getPrivateKey(): string {
    const e = this.env();
    const raw =
      process.env[`FIRELIGHT_SAML_PRIVATE_KEY_${e.toUpperCase()}`] ||
      process.env.FIRELIGHT_SAML_PRIVATE_KEY ||
      '';
    return this.formatPEM(raw, 'PRIVATE KEY');
  }

  private getCertificate(): string {
    const e = this.env();
    const raw =
      process.env[`FIRELIGHT_SAML_CERTIFICATE_${e.toUpperCase()}`] ||
      process.env.FIRELIGHT_SAML_CERTIFICATE ||
      '';
    return this.formatPEM(raw, 'CERTIFICATE');
  }

  private get issuer(): string {
    return process.env.FIRELIGHT_ISSUER || 'VFS_Identifier';
  }
  private get organizationId(): string {
    return process.env.FIRELIGHT_ORGANIZATION_ID || '3954';
  }
  private get userRole(): string {
    return process.env.FIRELIGHT_USER_ROLE || 'Agent';
  }
  private get userRights(): string {
    return process.env.FIRELIGHT_USER_RIGHTS || 'Full';
  }
  private get externalRoleCode(): string {
    return process.env.FIRELIGHT_EXTERNAL_ROLE_CODE || 'VFS_Agent';
  }
  private get carrierCode(): string {
    return process.env.FIRELIGHT_CARRIER_CODE || 'VFS';
  }

  isConfigured(): boolean {
    return Boolean(this.getPrivateKey() && this.getCertificate());
  }

  getEndpoint(): string {
    return ENDPOINTS[this.env()];
  }

  // -------------------------------------------------------------------------
  // Tx1228 (ACORD) — the agent's data, base64-encoded into SSO_SESSION_INFO.

  buildTx1228(req: FireLightSSORequest): string {
    const xml =
      `<TXLife xmlns="http://ACORD.org/Standards/Life/2">` +
      `<TXLifeRequest>` +
      `<TransRefGUID>${uuidv4()}</TransRefGUID>` +
      `<TransType tc="1228">OLI_TRANS_TRNPRODINQ</TransType>` +
      `<TransSubType tc="22800">OLI_TRANSSUB_PRODDETALL</TransSubType>` +
      `<OLifE>` +
      `<Party id="Agent_Party">` +
      `<PartyTypeCode tc="1">OLI_PT_Person</PartyTypeCode>` +
      `<FullName>${this.escapeXml(req.fullName)}</FullName>` +
      `<EMailAddress><AddrLine>${this.escapeXml(req.email)}</AddrLine></EMailAddress>` +
      `<Person/>` +
      `<Producer>` +
      `<CarrierAppointment PartyID="Agent_Party">` +
      `<CompanyProducerID>${this.escapeXml(req.companyProducerId)}</CompanyProducerID>` +
      `<CarrierCode>${this.escapeXml(this.carrierCode)}</CarrierCode>` +
      `</CarrierAppointment>` +
      `</Producer>` +
      `</Party>` +
      `<Relation OriginatingObjectID="Agent_Party">` +
      `<RelationRoleCode tc="11">OLI_REL_AGENT</RelationRoleCode>` +
      `</Relation>` +
      `</OLifE>` +
      `</TXLifeRequest>` +
      `</TXLife>`;
    return Buffer.from(xml, 'utf8').toString('base64');
  }

  // -------------------------------------------------------------------------
  // SAMLResponse

  generateSAMLResponse(req: FireLightSSORequest): FireLightSAMLResult {
    if (!this.isConfigured()) throw new Error('FireLight SAML signing keys not configured');

    const now = new Date();
    const notBefore = new Date(now.getTime() - 5 * 60 * 1000);
    const notOnOrAfter = new Date(now.getTime() + 5 * 60 * 1000);
    const responseId = `_${uuidv4()}`;
    const assertionId = `_${uuidv4()}`;
    const issueInstant = now.toISOString();
    const endpoint = this.getEndpoint();
    const ssoSessionInfo = this.buildTx1228(req);

    const canonical = this.buildCanonicalResponse({
      responseId,
      assertionId,
      issueInstant,
      notBefore: notBefore.toISOString(),
      notOnOrAfter: notOnOrAfter.toISOString(),
      endpoint,
      req,
      ssoSessionInfo,
    });

    const signed = this.sign(canonical, responseId);
    return {
      samlResponse: Buffer.from(signed).toString('base64'),
      endpoint,
      relayState: 'Home',
    };
  }

  private attribute(name: string, value: string): string {
    return (
      `<saml:Attribute Name="${name}" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri">` +
      `<saml:AttributeValue>${this.escapeXml(value)}</saml:AttributeValue>` +
      `</saml:Attribute>`
    );
  }

  private buildCanonicalResponse(params: {
    responseId: string;
    assertionId: string;
    issueInstant: string;
    notBefore: string;
    notOnOrAfter: string;
    endpoint: string;
    req: FireLightSSORequest;
    ssoSessionInfo: string;
  }): string {
    const { req } = params;
    return (
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Destination="${params.endpoint}" ID="${params.responseId}" IssueInstant="${params.issueInstant}" Version="2.0">` +
      `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${this.escapeXml(this.issuer)}</saml:Issuer>` +
      `<!--SIGNATURE-->` +
      `<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"></samlp:StatusCode></samlp:Status>` +
      `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${params.assertionId}" IssueInstant="${params.issueInstant}" Version="2.0">` +
      `<saml:Issuer>${this.escapeXml(this.issuer)}</saml:Issuer>` +
      `<saml:Subject>` +
      `<saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">${this.escapeXml(req.nameId)}</saml:NameID>` +
      `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">` +
      `<saml:SubjectConfirmationData NotOnOrAfter="${params.notOnOrAfter}" Recipient="${params.endpoint}"></saml:SubjectConfirmationData>` +
      `</saml:SubjectConfirmation>` +
      `</saml:Subject>` +
      `<saml:Conditions NotBefore="${params.notBefore}" NotOnOrAfter="${params.notOnOrAfter}"></saml:Conditions>` +
      `<saml:AuthnStatement AuthnInstant="${params.issueInstant}">` +
      `<saml:AuthnContext>` +
      `<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>` +
      `</saml:AuthnContext>` +
      `</saml:AuthnStatement>` +
      `<saml:AttributeStatement>` +
      this.attribute(CLAIM.role, this.userRole) +
      this.attribute(CLAIM.rights, this.userRights) +
      this.attribute(CLAIM.organizationId, this.organizationId) +
      this.attribute(CLAIM.nameIdentifier, req.nameId) +
      this.attribute(CLAIM.externalRoleCode, this.externalRoleCode) +
      this.attribute(CLAIM.ssoSessionInfo, params.ssoSessionInfo) +
      `</saml:AttributeStatement>` +
      `</saml:Assertion>` +
      `</samlp:Response>`
    );
  }

  // -------------------------------------------------------------------------
  // Signing (copied verbatim from the proven iPipeline implementation).

  private sign(xml: string, responseId: string): string {
    const privateKey = this.getPrivateKey();
    const certB64 = this.cleanCertificate(this.getCertificate());
    if (!privateKey || !certB64) throw new Error('FireLight SAML signing keys not configured');

    const cleanXml = xml.replace('<!--SIGNATURE-->', '');
    const digest = crypto.createHash('sha256').update(cleanXml, 'utf8').digest('base64');

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

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signedInfoCanonical, 'utf8');
    const signatureValue = signer.sign(privateKey, 'base64');

    const signedInfoInner = signedInfoCanonical.replace(
      ` xmlns:ds="http://www.w3.org/2000/09/xmldsig#"`,
      ''
    );
    const signatureBlock =
      `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">` +
      signedInfoInner +
      `<ds:SignatureValue>${signatureValue}</ds:SignatureValue>` +
      `<ds:KeyInfo>` +
      `<ds:X509Data>` +
      `<ds:X509Certificate>${certB64}</ds:X509Certificate>` +
      `</ds:X509Data>` +
      `</ds:KeyInfo>` +
      `</ds:Signature>`;

    return xml.replace('<!--SIGNATURE-->', signatureBlock);
  }

  private formatPEM(pem: string, type: string): string {
    if (!pem) return '';
    let formatted = pem.replace(/\\n/g, '\n').replace(/\s/g, '');
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

  private cleanCertificate(cert: string): string {
    return cert
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s/g, '');
  }

  /** Escape XML text per Exclusive C14N (only & < > and \r). */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\r/g, '&#xD;');
  }
}

export const fireLightSAML = new FireLightSAMLClient();
