# FireLight SSO — Exact Requirements (researched 2026-06-12)

Sources: `integration-docs/FireLight Developer Guide.pdf` (pp. 217–230),
`integration-docs/Single Sign-On Overview_Ref_V1 3.pdf`, requirements call
transcript (2026-04-02), FireLight Admin portal (role codes + org code).

## Protocol

**SAML 2.0 IdP-initiated SSO, HTTP POST binding.** Valor is the Identity
Provider. Our portal builds a signed `SAMLResponse` and form-POSTs it to the
FireLight endpoint; FireLight creates/updates the user and lands them on the
FireLight Home page. The ACORD Tx1228 ("passing in the agent data" per the
Hexure call) rides INSIDE the SAML assertion as the base64-encoded
`SSO_SESSION_INFO` claim — it is not a separate integration.

## Endpoints (fixed, from Developer Guide p. 223)

| Environment | URL |
|---|---|
| UAT | `https://uat.firelighteapp.com/egapp/idp-initiatedsso.aspx` |
| Production | `https://www.firelighteapp.com/egapp/idp-initiatedsso.aspx` |

`RelayState` may be `Home`, `NewApplication`, `Applications`, or `OSJ` to pick
the landing page; `?appId=<id>` deep-links into an application (with
`RelayState=eSign` for signature flow).

## Required SAML assertions

| # | Item | Where / claim URI | Valor value |
|---|---|---|---|
| 1 | Issuer | `<Issuer>` element — "the certificate identifier" | Our proposed IdP URIs: UAT `https://app.valorfs.com/sso/firelight/uat`, Prod `https://app.valorfs.com/sso/firelight` — Hexure must register these against the certs we sent |
| 2 | NameID | `<Subject><NameID>` | User's name |
| 3 | USER_ROLE | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` | `Agent` (options: Agent / OSJ / Client) |
| 4 | USER_RIGHTS | `http://schemas.insurancetechnologies.com/2010/01/identity/claims/rights` | `Full` or `Limited` (confirm w/ Hexure; likely `Full` for agents) |
| 5 | ORGANIZATION_ID | `http://schemas.insurancetechnologies.com/2010/01/identity/claims/organizationid` | **`3954`** (Org code from FireLight Admin > Groups, "Valor Financial Specialists") |
| 6 | NAME_IDENTIFIER | `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/privatepersonalidentifier` | Our stable unique user key (Valor `users.id`). Optional **only** if SSO_SESSION_INFO is included |

## Optional assertions we will use

| Item | Claim URI | Valor value |
|---|---|---|
| EXTERNAL_ROLE_CODE | `http://schemas.insurancetechnologies.com/2010/01/identity/claims/externalrolecode` | **`VFS_Agent`** (maps user into the FireLight Agent group; VFS_Admin / VFS_Reviewer also exist) |
| SSO_SESSION_INFO | `http://schemas.insurancetechnologies.com/2010/01/identity/claims/ssosessioninfo` | Base64-encoded ACORD Tx1228 XML with the agent's data (see below) |

Not needed now: SSO_NB (TX103 new-business push), BRANDING.

## The Tx1228 payload (inside SSO_SESSION_INFO)

Per Developer Guide sample (p. 228) — minimal agent shape:

```xml
<TXLife xmlns="http://ACORD.org/Standards/Life/2">
  <TXLifeRequest>
    <TransRefGUID>{unique-guid-per-login}</TransRefGUID>
    <TransType tc="1228">OLI_TRANS_TRNPRODINQ</TransType>
    <TransSubType tc="22800">OLI_TRANSSUB_PRODDETALL</TransSubType>
    <OLifE>
      <Party id="Agent_Party">
        <PartyTypeCode tc="1">OLI_PT_Person</PartyTypeCode>
        <FullName>{First Last}</FullName>
        <EMailAddress><AddrLine>{email}</AddrLine></EMailAddress>
        <Person/>
        <Producer>
          <CarrierAppointment PartyID="Agent_Party">
            <CompanyProducerID>{our unique agent ID}</CompanyProducerID>
            <CarrierCode>{CARRIER CODE — still needed from Hexure}</CarrierCode>
          </CarrierAppointment>
        </Producer>
      </Party>
      <Relation OriginatingObjectID="Agent_Party">
        <RelationRoleCode tc="11">OLI_REL_AGENT</RelationRoleCode>
      </Relation>
    </OLifE>
  </TXLifeRequest>
</TXLife>
```

Firm/DistributionAgreement parties are only needed for multi-firm product
filtering — not Valor's simple agent setup. Note: when a Tx1228 is sent via
SSO, `<UserAuthRequest>` is NOT required (the SAML signature authenticates us).

## Signing

The `SAMLResponse` is signed with our private key; FireLight validates with
the certificates we already sent (`uat-certificate.pem` ✅ sent,
`prod-certificate.pem` ✅ sent). Keys per environment live in `.env` (see
`certs/README.md`).

## Status — what's resolved vs. still open

| Item | Status |
|---|---|
| Protocol + endpoints | ✅ Known (UAT/Prod URLs above, fixed) |
| Certificates | ✅ Sent to Hexure (UAT + Prod) |
| ORGANIZATION_ID | ✅ `3954` — ask Hexure to confirm in writing |
| EXTERNAL_ROLE_CODE | ✅ `VFS_Agent` |
| All claim URIs / assertion structure | ✅ From Developer Guide |
| Issuer registration | ⬜ Hexure must confirm our proposed Issuer URIs are configured against our certs (or tell us the string they registered) |
| **CarrierCode** | ⬜ ONLY remaining data item — carrier-specific value(s) for the Tx1228 `<CarrierCode>`; ask Diane |
| USER_RIGHTS value | ⬜ Confirm `Full` vs `Limited` for agents (one-line question) |
| CompanyProducerID source | ⬜ Our side: add/choose stable agent identifier on User model |
| Whitelisting FireLight IPs | ⬜ Our side, for SFTP (see IP Ranges doc) — flagged on the call |

## Build plan (once CarrierCode + Issuer confirmation arrive)

1. `lib/integrations/firelight/saml.ts` — build + sign SAMLResponse (claims
   above), base64 Tx1228 builder.
2. `POST`-redirect page: server route renders an auto-submitting form to the
   FireLight endpoint with `SAMLResponse` (+ optional `RelayState`).
3. Sidebar/launch link for agents (pattern exists: WinFlex/iPipeline launch
   links in `components/layout/AppLayout.tsx`).
4. Env vars: `FIRELIGHT_SSO_URL_{UAT,PROD}`, `FIRELIGHT_ORGANIZATION_ID=3954`,
   `FIRELIGHT_EXTERNAL_ROLE_CODE=VFS_Agent`, `FIRELIGHT_CARRIER_CODE`,
   `FIRELIGHT_SAML_PRIVATE_KEY_{UAT,PROD}`, issuer URIs.
