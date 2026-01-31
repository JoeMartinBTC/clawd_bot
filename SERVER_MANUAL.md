# Moltbot Server Documentation (Hetzner 46.62.133.89)

**Last Updated:** 2026-01-31
**Status:** Operational / Production

## 1. System Overview
- **Host:** Hetzner Dedicated Server (IP: `46.62.133.89`)
- **User:** `root` (Docker Host), `nexus` (User Space)
- **Deployment Method:** Docker Compose
- **Service Name:** `moltbot` (Container: `moltbot-moltbot-gateway-1`)

## 2. Environment Variables & Keys
The system uses a hybrid configuration layout. **Do not modify blindly.**

| Variable | Location | Notes |
|---|---|---|
| `GEMINI_API_KEY` | `docker-compose.yml` (mapped from `.env`) | **CRITICAL:** Passed via `environment:` block to container. |
| `GOOGLE_API_KEY` | `docker-compose.yml` (mapped from `.env`) | **CRITICAL:** Mirrored from `GEMINI_API_KEY`. |
| `ANTHROPIC_API_KEY` | `.env` -> `docker-compose.yml` | Main LLM key. |
| `TELEGRAM_BOT_TOKEN` | `.env` -> `docker-compose.yml` | Bot Identity. |
| `Gmail Credentials` | `moltbot.json` (inside container/volume) | Hardcoded in JSON config (`joemartinbtc21`). |

**File Locations on Host:**
- **Docker Compose:** `/root/moltbot/docker-compose.yml`
- **Environment File:** `/root/moltbot/.env`
- **Config JSON:** `/root/.clawdbot/moltbot.json` (Bind-mounted to `/home/node/.clawdbot/moltbot.json`)

## 3. Configuration Management (HOW-TO)

### How to Change an API Key
1.  **Edit .env:** `nano /root/moltbot/.env`
2.  **Edit docker-compose.yml (IF NEW VARIABLE):**
    *   Docker does *not* automatically pass all ENV vars to the container.
    *   If adding a *new* key, you MUST add it to the `environment:` section in `docker-compose.yml`:
        ```yaml
        environment:
          NEW_KEY: ${NEW_KEY}
        ```
3.  **Apply Changes:**
    ```bash
    cd /root/moltbot
    docker compose up -d
    ```
    *   *Note:* `docker restart` is **NOT** sufficient to update environment variables. You must use `up -d`.

### How to Edit moltbot.json (Config/Plugins)
1.  **Edit File:** `nano /root/.clawdbot/moltbot.json`
2.  **Validate JSON:** Ensure strict JSON syntax (no trailing commas!).
3.  **Restart Container:**
    ```bash
    docker restart moltbot-moltbot-gateway-1
    ```

## 4. Emergency Procedures (Panic Protocol)

**Symptom: Bot is offline / Restart Loop**
1.  **Check Logs:**
    ```bash
    docker logs --tail 50 -f moltbot-moltbot-gateway-1
    ```
2.  **Common Errors:**
    *   `Config invalid ... plugin not found`: You have a plugin in `moltbot.json` that is not installed/enabled. Remove the block.
    *   `EADDRINUSE`: Port conflict. Check for rogue containers.
3.  **Nuclear Reset (Safe):**
    If multiple containers are running or state is inconsistent:
    ```bash
    # 1. Stop everything
    docker stop $(docker ps -a -q)
    
    # 2. Cleanup
    docker system prune -f
    
    # 3. Start fresh (Config persistiert in /root/.clawdbot)
    cd /root/moltbot
    docker compose up -d --force-recreate
    ```

## 5. Verification
After any change, verify the container sees the new values:
```bash
docker exec moltbot-moltbot-gateway-1 env | grep KEY_NAME
```
If this command returns empty or old values, the `docker compose` mapping is missing.

---
**Maintainer Note:**
Always respect **First Principles**. Do not assume previous state. Verify file existence before editing. Verify uptime (>10s) after restarting.
