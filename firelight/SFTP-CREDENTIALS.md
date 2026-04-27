# FireLight SFTP Credentials

## Server Info
| Field | Value |
|-------|-------|
| Host | 5.161.215.156 |
| Port | 22 |
| Username | firelight |
| Password | *(stored on VPS, set via `passwd firelight`)* |
| Production Directory | /PROD |

## VPS Details
- **Provider:** Hetzner
- **IP:** 5.161.215.156
- **OS:** Ubuntu 24.04
- **Hostname:** apex-n8n-production
- **Login:** `ssh root@5.161.215.156`

## Hexure IPs Whitelisted
| Environment | IP |
|-------------|-----|
| Test | 20.236.70.194 |
| UAT/Staging | 20.225.104.94 |
| Production | 20.241.57.83 |

## File Watcher Service
- **Script:** `/opt/firelight-watcher/firelight-watcher.js`
- **Config:** `/opt/firelight-watcher/.env`
- **Service:** `firelight-watcher.service`
- **Status:** `systemctl status firelight-watcher`
- **Logs:** `journalctl -u firelight-watcher --no-pager -n 50`
- **Restart:** `systemctl restart firelight-watcher`

## Directory Structure
```
/home/firelight/
└── PROD/
    ├── (incoming XML files land here)
    ├── processed/   (successfully sent to Valor API)
    └── failed/      (failed to process)
```

## Valor API Endpoint
- **URL:** https://valorfs.app/api/inbound/firelight
- **Auth:** `x-api-key` header (key stored in Vercel + VPS .env)
- **Tenant:** valor-default-tenant
