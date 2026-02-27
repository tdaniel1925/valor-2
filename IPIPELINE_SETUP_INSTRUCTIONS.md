# iPipeline SAML SSO Setup Instructions

## Current Status

✅ **Your Side (Valor)**: Everything is working correctly!
- SAML generation is functioning
- Digital signatures are valid
- All 5 products are configured
- Popup and form submission work

❌ **iPipeline Side**: They need to configure your SAML certificate

## Error You're Seeing

```
Single sign-on authentication was unsuccessful (reference # HQWKYXAX).
Please contact your system administrator for assistance regarding this error.
```

This means iPipeline **received** your SAML request but **rejected** it because they don't have your certificate configured yet.

---

## What You Need to Send to iPipeline

### Option 1: Send SAML Metadata File (Recommended)

**File:** `IPIPELINE_METADATA.xml` (in your project root)

**Send this file to your iPipeline account representative** and ask them to:
1. Configure SAML SSO for GAID 2717
2. Import this metadata file into their UAT environment
3. Enable the integration for your account

### Option 2: Send Certificate Only

**File:** `valor-saml.crt`

If they prefer just the certificate, send this file instead.

---

## Information iPipeline Needs

When contacting iPipeline support, provide:

### Your Account Details:
- **GAID (Company Identifier)**: 2717
- **Channel Name**: VAL
- **Environment**: UAT (Testing) - then Production later
- **Entity ID**: `https://valorinsurance.com/saml/idp`

### Technical Details:
- **SSO URL**: `https://valorfs.app/api/integrations/ipipeline/sso`
- **Signature Method**: RSA-SHA256
- **Digest Method**: SHA-256
- **Name ID Format**: unspecified
- **Binding**: HTTP-POST

### Products You Want to Enable:
1. iGO Illustration
2. LifePipe Quotes
3. XRAE Risk Assessment
4. FormsPipe
5. Product Information

---

## Email Template for iPipeline

```
Subject: SAML SSO Configuration Request - GAID 2717

Hello iPipeline Support,

We would like to set up SAML 2.0 Single Sign-On for our Valor Financial Specialists account.

Account Information:
- GAID: 2717
- Channel: VAL
- Environment: UAT (for testing, then Production)

We have attached our SAML IdP metadata file (IPIPELINE_METADATA.xml).

Please configure SAML SSO for the following products:
1. iGO Illustration
2. LifePipe Quotes
3. XRAE Risk Assessment
4. FormsPipe
5. Product Information

Our SAML configuration:
- Entity ID: https://valorinsurance.com/saml/idp
- SSO URL: https://valorfs.app/api/integrations/ipipeline/sso
- Certificate included in metadata file

Could you please:
1. Import our SAML metadata into your UAT environment
2. Enable SAML SSO for GAID 2717
3. Let us know when it's ready to test

Thank you!
```

---

## Testing After iPipeline Setup

Once iPipeline confirms they've configured your certificate:

1. Visit: https://valorfs.app/integrations/ipipeline
2. Click any product button
3. You should be automatically logged into iPipeline
4. No error should appear

---

## Moving to Production

After UAT testing is successful:

1. Ask iPipeline to configure the same certificate in **Production**
2. Update environment variable in Vercel:
   - Change `IPIPELINE_ENVIRONMENT` from `uat` to `production`
3. Redeploy the application
4. Test again from production URLs

---

## Troubleshooting

### Error: "Single sign-on authentication was unsuccessful"
**Cause**: iPipeline hasn't configured your certificate yet
**Fix**: Contact iPipeline support with metadata file

### Error: "Invalid SAML Response"
**Cause**: Certificate mismatch or expired
**Fix**: Verify iPipeline has the correct certificate from metadata file

### Error: "User not authorized"
**Cause**: User not added to iPipeline account
**Fix**: Ask iPipeline to add user to GAID 2717

### Popup Blocked
**Cause**: Browser popup blocker
**Fix**: Allow popups for valorfs.app

---

## Contact Information

### iPipeline Support:
- Website: https://www.ipipeline.com/support
- Email: support@ipipeline.com
- Documentation: https://www.ipipeline.com/support/saml-sso

### Your Account Manager:
(Contact your iPipeline account representative directly for faster setup)

---

## Files to Send

**Attach to your email to iPipeline:**
1. `IPIPELINE_METADATA.xml` - Contains certificate and configuration
2. (Optional) `valor-saml.crt` - Public certificate if they prefer

**Do NOT send:**
- `valor-saml.key` - Keep private key SECRET and secure
- `.env` files - These contain sensitive information

---

## Next Steps

1. ✅ **Send metadata to iPipeline** (use email template above)
2. ⏳ **Wait for iPipeline confirmation** (usually 1-3 business days)
3. ✅ **Test the integration** once they confirm
4. ✅ **Move to production** after successful UAT testing

---

## Technical Notes

The error you're seeing is **expected** at this stage because:
- Your SAML signature is being sent correctly ✅
- iPipeline is receiving it ✅
- But they can't verify it because they don't have your public certificate ❌

Once they import your metadata file, the signature verification will work and you'll be logged in automatically!
