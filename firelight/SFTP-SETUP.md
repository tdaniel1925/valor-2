# FireLight SFTP Server Setup

## Overview

Cheap VPS (~$5/mo) running OpenSSH SFTP to receive outbound files from FireLight (Hexure).
A file watcher script polls for new XML files and POSTs them to the Valor API.

---

## 1. Provision VPS

Any provider works. Recommended: **DigitalOcean $4/mo droplet** or **Hetzner CX22 ~$4/mo**.

- OS: Ubuntu 22.04+ LTS
- 1 vCPU, 512MB-1GB RAM (plenty for SFTP + watcher)
- Region: US (closest to Hexure IPs for low latency)

## 2. Firewall — Whitelist Hexure IPs Only

```bash
# Allow SSH from your IP only
sudo ufw allow from YOUR_IP to any port 22

# Allow SFTP from Hexure IPs
sudo ufw allow from 20.236.70.194 to any port 22   # Test
sudo ufw allow from 20.225.104.94 to any port 22   # UAT/Staging
sudo ufw allow from 20.241.57.83 to any port 22    # Production

sudo ufw enable
```

## 3. Create SFTP User (Chrooted)

```bash
# Create a dedicated user with no shell access
sudo adduser --disabled-password --shell /usr/sbin/nologin firelight
sudo passwd firelight  # Set the password Hexure will use

# Create directory structure
sudo mkdir -p /home/firelight/PROD /home/firelight/UAT /home/firelight/Test
sudo mkdir -p /home/firelight/PROD/processed /home/firelight/PROD/failed
sudo mkdir -p /home/firelight/UAT/processed /home/firelight/UAT/failed
sudo mkdir -p /home/firelight/Test/processed /home/firelight/Test/failed

# Set ownership (chroot requires root owns the chroot dir)
sudo chown root:root /home/firelight
sudo chown firelight:firelight /home/firelight/PROD /home/firelight/UAT /home/firelight/Test
sudo chown -R firelight:firelight /home/firelight/PROD/processed /home/firelight/PROD/failed
sudo chown -R firelight:firelight /home/firelight/UAT/processed /home/firelight/UAT/failed
sudo chown -R firelight:firelight /home/firelight/Test/processed /home/firelight/Test/failed
```

## 4. Configure SFTP Chroot

Add to `/etc/ssh/sshd_config`:

```
Match User firelight
    ChrootDirectory /home/firelight
    ForceCommand internal-sftp
    AllowTcpForwarding no
    X11Forwarding no
    PasswordAuthentication yes
```

Then restart SSH:

```bash
sudo systemctl restart sshd
```

## 5. Install Node.js and File Watcher

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create watcher directory
sudo mkdir -p /opt/firelight-watcher
cd /opt/firelight-watcher

# Copy the watcher script from Valor repo
# scp scripts/firelight-watcher.ts to this location

# Install dependencies
npm init -y
npm install typescript ts-node
```

## 6. Environment Variables

Create `/opt/firelight-watcher/.env`:

```env
VALOR_API_URL=https://app.valorfs.app
FIRELIGHT_INBOUND_API_KEY=generate-a-strong-key-here
VALOR_TENANT_ID=your-tenant-uuid
SFTP_WATCH_DIR=/home/firelight/PROD
SOURCE_ENVIRONMENT=prod
POLL_INTERVAL_MS=10000
```

Generate the API key:
```bash
openssl rand -hex 32
```

Add the same key to Valor's `.env`:
```env
FIRELIGHT_INBOUND_API_KEY=same-key-here
```

## 7. Systemd Service

Create `/etc/systemd/system/firelight-watcher.service`:

```ini
[Unit]
Description=FireLight SFTP File Watcher
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/firelight-watcher
EnvironmentFile=/opt/firelight-watcher/.env
ExecStart=/usr/bin/npx ts-node /opt/firelight-watcher/firelight-watcher.ts
Restart=always
RestartSec=10
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable firelight-watcher
sudo systemctl start firelight-watcher
sudo journalctl -u firelight-watcher -f  # View logs
```

## 8. Provide Credentials to Hexure

Send Hexure the following:

| Field | Value |
|-------|-------|
| FQDN | `sftp.valorfs.app` (or VPS IP) |
| Port | `22` |
| Username | `firelight` |
| Password | (the password you set) |
| Test directory | `/Test` |
| UAT directory | `/UAT` |
| Prod directory | `/PROD` |

---

## Monitoring

Check watcher status:
```bash
sudo systemctl status firelight-watcher
```

View recent logs:
```bash
sudo journalctl -u firelight-watcher --since "1 hour ago"
```

Check for stuck/failed files:
```bash
ls -la /home/firelight/PROD/failed/
```
