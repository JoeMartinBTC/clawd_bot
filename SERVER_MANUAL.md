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
- **Docker Compose:** `/root/moltbot/docker-compose.yml` (Maps ENV)
- **Environment File:** `/root/moltbot/.env` (TRUSTED SOURCE OF TRUTH)
- **Config JSON:** `/root/.clawdbot/moltbot.json` (Uses placeholders `${VAR}`)

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

## 6. Detailed Configuration Rules (Updated)

> [!IMPORTANT]
> **The Triad of Configuration:**
> To add a new AI Provider (e.g., Kimi/Moonshot), you must touch **THREE** places. Missing one results in failure.

1.  **The Secret Source (`.env`):**
    *   Stores the actual API Key.
    *   Example: `MOONSHOT_API_KEY=sk-123...`
2.  **The Delivery Channel (`docker-compose.yml`):**
    *   **CRITICAL:** Docker does NOT see the `.env` file automatically inside the container. You must EXPLICITLY map it.
    *   You must add: `MOONSHOT_API_KEY: ${MOONSHOT_API_KEY}` under `services.moltbot-gateway.environment`.
3.  **The Application Logic (`moltbot.json`):**
    *   Defines usage (BaseURL, Models).
    *   Usage: `"apiKey": "MOONSHOT_API_KEY"` (or explicit key string).

### The "Allowlist" Trap
If `agents.defaults.models` is present in `moltbot.json` (which it is), the bot enters **STRICT MODE**.
*   **Result:** Only models explicitly listed in this object are allowed.
*   **Symptom:** "Model not in allowlist".
*   **Fix:** You must verify the exact model ID (e.g., `moonshot/kimi-k2-0905-preview`) and add an empty object `{}` or alias config to `agents.defaults.models`.

## 7. Kimi (Moonshot AI) Integration
**Provider:** `moonshot`
**Model:** `kimi-k2-0905-preview`

### Setup Checklist
- [ ] Get Key from [Moonshot Platform](https://platform.moonshot.cn).
- [ ] Add `MOONSHOT_API_KEY=sk-...` to `/root/moltbot/.env`.
- [ ] Add `MOONSHOT_API_KEY: ${MOONSHOT_API_KEY}` to `/root/moltbot/docker-compose.yml` (environment section).
- [ ] Add provider config to `moltbot.json` (`models.providers.moonshot`).
- [ ] **Allowlist:** Add `"moonshot/kimi-k2-0905-preview": {}` to `agents.defaults.models` in `moltbot.json`.
- [ ] **Restart:** `cd /root/moltbot && docker compose up -d` (Recreates container to load ENV).

## 8. Security Architecture (Hardened)

> [!CAUTION]
> **NEVER** create files named `*_recovery.json` containing real secrets.
> **NEVER** set `trustedProxies` to `0.0.0.0/0`.

The system now operates in **Strict Security Mode**:

1.  **Zero-Trust Config:** The configuration file `moltbot.json` contains **NO secrets**. It uses `${ENV_VAR}` exclusively.
2.  **Environment Isolation:** Secrets live ONLY in `.env` (root-protected).
3.  **Network Lockdown:**
    *   **Allowed:** `127.0.0.1` (Localhost), `10.0.0.0/8` (Tailscale/Private), `::1`.
    *   **Blocked:** Public Internet (`0.0.0.0/0`).
4.  **Audit Compliance:**
    *   The repository is "Clean" (Open Code Verified).
    *   Any checking of hardcoded keys effectively fails the build policy.

---
**Maintainer Note:**
Always respect **First Principles**. Do not assume previous state. Verify file existence before editing. Verify uptime (>10s) after restarting.
