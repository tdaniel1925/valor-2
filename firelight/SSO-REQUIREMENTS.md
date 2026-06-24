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
| 1 | Issuer | `<Issuer>` element — "the certificate identifier" | **`VFS_Identifier`** — confirmed by Hexure (Chuck, 2026-06-23): VFS's identifier is set to `VFS_Identifier` in BOTH UAT and prod. Use this exact literal string in `<Issuer>`. (Supersedes our earlier proposed URIs.) |
| 2 | NameID | `<Subject><NameID>` | User's name |
| 3 | USER_ROLE | `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` | `Agent` (options: Agent / OSJ / Client) |
| 4 | USER_RIGHTS | `http://schemas.insurancetechnologies.com/2010/01/identity/claims/rights` | **`Full`** — confirmed by Hexure (2026-06-24). Agents get full rights within their functional area. |
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
            <CarrierCode>VFS</CarrierCode>
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
| Issuer (`<Issuer>` value) | ✅ `VFS_Identifier` — confirmed by Hexure (Chuck, 2026-06-23), same in UAT + prod |
| **CarrierCode** | ✅ `VFS` — confirmed by Hexure (2026-06-24). Goes in the Tx1228 `<CarrierAppointment><CarrierCode>`. |
| USER_RIGHTS value | ✅ `Full` — confirmed by Hexure (2026-06-24) |
| CompanyProducerID source | ⬜ Our side: add/choose stable agent identifier on User model |
| Whitelisting FireLight IPs | ⬜ Our side, for SFTP (see IP Ranges doc) — flagged on the call |

**ALL HEXURE-SIDE ITEMS RESOLVED.** Only our-side tasks remain (CompanyProducerID
field + IP whitelisting). The SSO build is unblocked.

## BUILD STATUS: ✅ BUILT (2026-06-24)
- `lib/integrations/firelight/saml.ts` — FireLightSAMLClient: signed SAMLResponse
  (Issuer VFS_Identifier + 6 claims) + base64 Tx1228 in SSO_SESSION_INFO. Signing
  reuses the proven iPipeline exc-c14n + Node-crypto approach (RSA-SHA256).
- `app/api/integrations/firelight/sso/route.ts` — GET: auth + resolve agent by
  email → apexContactId as CompanyProducerID → signed SAMLResponse + endpoint.
- `components/layout/AppLayout.tsx` — FireLight sidebar item → launchFireLight()
  auto-POSTs SAMLResponse + RelayState to the endpoint (new tab).
- `.env.example` — FIRELIGHT_SSO_* vars documented (env-specific key/cert pairs).
- Verified 18/18: claims, Tx1228 (CarrierCode VFS), signature validates; build
  succeeds with keys unset (lazy env).
- REMAINING to go live: (1) load the SAML private key/cert into env
  (FIRELIGHT_SAML_PRIVATE_KEY_UAT / _CERTIFICATE_UAT — the .pem keypair whose cert
  was sent to Hexure); (2) UAT test the round-trip.

## CompanyProducerID — RESOLVED (2026-06-24)
Hexure (Diane, deferring to Chuck): FireLight does NOT require a specific
identifier format — "if you require a unique contact identifier for the agent,
then that is what you need to send." So an arbitrary stable string is accepted.
We send `apexContactId` (e.g. `Contact.450.23527577`) — already what the route
does, **no code change needed**. Trent emailed back two confirmations (2026-06-24):
(a) arbitrary stable string OK / no required format, (b) whether the field is
required or optional. Awaiting Chuck's final word, but the build already matches
the described behavior. NOT a blocker.

## Build plan (all Hexure inputs received — ready to build)

1. `lib/integrations/firelight/saml.ts` — build + sign SAMLResponse (claims
   above), base64 Tx1228 builder.
2. `POST`-redirect page: server route renders an auto-submitting form to the
   FireLight endpoint with `SAMLResponse` (+ optional `RelayState`).
3. Sidebar/launch link for agents (pattern exists: WinFlex/iPipeline launch
   links in `components/layout/AppLayout.tsx`).
4. Env vars (all values now known except the private keys):
   `FIRELIGHT_SSO_URL_UAT=https://uat.firelighteapp.com/egapp/idp-initiatedsso.aspx`,
   `FIRELIGHT_SSO_URL_PROD=https://www.firelighteapp.com/egapp/idp-initiatedsso.aspx`,
   `FIRELIGHT_ORGANIZATION_ID=3954`, `FIRELIGHT_EXTERNAL_ROLE_CODE=VFS_Agent`,
   `FIRELIGHT_ISSUER=VFS_Identifier`, `FIRELIGHT_CARRIER_CODE=VFS`,
   `FIRELIGHT_USER_RIGHTS=Full`, `FIRELIGHT_SAML_PRIVATE_KEY_{UAT,PROD}`.
