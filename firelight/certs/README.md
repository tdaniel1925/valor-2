# FireLight SSO Certificates

## Purpose
These X.509 certificates are used to sign SAML 2.0 assertions sent to FireLight (Hexure).
FireLight stores our **public certificate** in their admin tool to verify assertion signatures.
We sign assertions using our **private key** (stored in environment variables, never committed).

---

## Files

| File | Environment | Purpose | Share with FireLight? |
|---|---|---|---|
| `uat-certificate.pem` | UAT | Public cert — give to FireLight team | ✅ YES |
| `uat-private.key` | UAT | Private key — signs SAML assertions | ❌ NO — move to .env |
| `prod-certificate.pem` | Production | Public cert — give to FireLight team | ✅ YES |
| `prod-private.key` | Production | Private key — signs SAML assertions | ❌ NO — move to .env |

---

## Certificate Details

### UAT
- **CN:** firelight-uat.valorfs.app
- **Valid:** Apr 16, 2026 → Apr 15, 2029
- **SHA-256 Fingerprint:** C5:54:50:E0:E9:40:C5:1E:CE:F4:C7:28:C4:8D:94:41:6D:FC:A8:EA:F6:05:06:CF:17:DF:DA:15:A9:99:87:CF

### Production
- **CN:** firelight.valorfs.app
- **Valid:** Apr 16, 2026 → Apr 15, 2029
- **SHA-256 Fingerprint:** EA:95:78:18:AA:1F:2D:03:F9:D9:14:8B:37:62:64:57:63:07:B8:EE:AB:81:F3:4E:8F:F1:0E:59:EF:E6:61:FE

---

## Environment Variables

Add the following to `.env.local` (and Vercel env config for production):

```
# FireLight SSO — UAT
FIRELIGHT_UAT_PRIVATE_KEY="<contents of uat-private.key>"
FIRELIGHT_UAT_CERT="<contents of uat-certificate.pem>"
FIRELIGHT_UAT_ORG_ID=""              # TBD — get from FireLight team
FIRELIGHT_UAT_ISSUER=""              # TBD — get from FireLight team (IDP Identifier)
FIRELIGHT_UAT_CARRIER_CODE=""        # TBD — get from FireLight team
FIRELIGHT_UAT_SSO_URL="https://flqa.insurancetechnologies.com/egapp/idpinitiatedsso.aspx"

# FireLight SSO — Production
FIRELIGHT_PROD_PRIVATE_KEY="<contents of prod-private.key>"
FIRELIGHT_PROD_CERT="<contents of prod-certificate.pem>"
FIRELIGHT_PROD_ORG_ID=""             # TBD — get from FireLight team
FIRELIGHT_PROD_ISSUER=""             # TBD — get from FireLight team (IDP Identifier)
FIRELIGHT_PROD_CARRIER_CODE=""       # TBD — get from FireLight team
FIRELIGHT_PROD_SSO_URL="https://www.firelighteapp.com/egapp/idpinitiatedsso.aspx"
```

---

## What to Send FireLight

Email the following to Nicole Eberhart-Blair / Diane Irwin / Renee Phipps:

1. Attach `uat-certificate.pem` (UAT, priority)
2. Attach `prod-certificate.pem` (Production)
3. Tell them our proposed Issuer URI:
   - UAT: `https://app.valorfs.com/sso/firelight/uat`
   - Prod: `https://app.valorfs.com/sso/firelight`

Ask them to confirm/provide:
- ORGANIZATION_ID (their org code for Valor/PSA)
- IDP Identifier (the exact Issuer string they want us to use)
- CarrierCode
- EXTERNAL_ROLE_CODE for agent role
- UAT SSO endpoint URL (confirm it matches above)
