# FireLight Integration

FireLight (by Hexure) is the e-application platform agents use to submit insurance applications.
Valor integrates via SAML 2.0 SSO and inbound SFTP for completed application data.

---

## Folder Structure

```
firelight/
├── README.md                   ← You are here
├── certs/
│   ├── README.md               ← Cert details, env vars, what to send FireLight
│   ├── uat-certificate.pem     ← PUBLIC — send to FireLight for UAT
│   ├── uat-private.key         ← PRIVATE — move to .env, do not commit
│   ├── prod-certificate.pem    ← PUBLIC — send to FireLight for Production
│   └── prod-private.key        ← PRIVATE — move to .env, do not commit
└── integration-docs/
    ├── FireLight Developer Guide.pdf         ← Full dev guide (SSO section ~p.218)
    ├── Single Sign-On Overview_Ref_V1 3.pdf  ← SSO overview + XML mockups
    ├── FireLight Outbound SFTP Documentation.docx ← SFTP setup requirements
    ├── FireLight IP Ranges_v13.pdf           ← IPs to whitelist for SFTP
    ├── Name Value Pair Example.zip           ← Sample NVP XML + PDFs from FireLight
    ├── Valor SSO_SFTP requirements call.docx ← Notes from kickoff call with Hexure
    └── Email.eml                             ← Original email from Hexure team
```

---

## Integration Overview

### SSO (Agent → FireLight)
When an agent clicks "Launch FireLight" in Valor:
1. Valor builds a **Tx1228 XML** with the agent's identity + producer ID
2. Embeds it (base64) in a signed **SAML 2.0 assertion**
3. HTTP POSTs to FireLight's SSO endpoint
4. Agent lands inside FireLight pre-authenticated

### SFTP (FireLight → Valor)
When an agent completes an application in FireLight:
1. FireLight pushes an **NVP XML file** to our SFTP server
2. XML contains all form fields + Base64-encoded PDF
3. Valor processes the file and links it to the correct case

---

## Status

| Item | Status | Notes |
|---|---|---|
| UAT certificate generated | ✅ | Send `uat-certificate.pem` to Hexure |
| Prod certificate generated | ✅ | Send `prod-certificate.pem` to Hexure |
| Private keys in .env | ⬜ | Move keys, add all env vars from `certs/README.md` |
| ORGANIZATION_ID | ⬜ | Waiting on Hexure team |
| IDP Identifier (Issuer) | ⬜ | Waiting on Hexure team |
| CarrierCode | ⬜ | Waiting on Hexure team |
| EXTERNAL_ROLE_CODE | ⬜ | Waiting on Hexure team |
| Agent CompanyProducerID mapping | ⬜ | Needs field on User model |
| SSO integration code built | ⬜ | Ready to build once env vars confirmed |
| SFTP server configured | ⬜ | Needs hosting decision (AWS Transfer vs self-hosted) |
| FireLight IPs whitelisted on SFTP | ⬜ | See IP Ranges doc |

---

## FireLight Contacts (Hexure)
- **Nicole Eberhart-Blair** — integration lead
- **Diane Irwin** — Director, Client Delivery — diane@insurancetechnologies.com — +1 719.955.5112
- **Renee Phipps** — team

## SSO Endpoints
| Environment | URL |
|---|---|
| QA/Dev | `https://flqa.insurancetechnologies.com/egapp/idpinitiatedsso.aspx` |
| UAT | `https://uat.firelighteapp.com/egapp/idpinitiatedsso.aspx` |
| Production | `https://www.firelighteapp.com/egapp/idpinitiatedsso.aspx` |

## FireLight IPs to Whitelist on SFTP
| Environment | IP |
|---|---|
| Test | `20.236.70.194` |
| UAT / Secondary Prod | `20.225.104.94` |
| Primary Production | `20.241.57.83` |
