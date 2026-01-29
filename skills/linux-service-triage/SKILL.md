---
name: linux-service-triage
description: Diagnoses common Linux service issues using logs, systemd/PM2, file permissions, Nginx reverse proxy checks, and DNS sanity checks.
---

# Linux & service basics: logs, systemd/PM2, permissions, Nginx reverse proxy, DNS checks

## PURPOSE
Diagnoses common Linux service issues on the HOST system.

## CRITICAL EXECUTION PATTERN (HOST ACCESS)
You are running in a container. You **DO NOT** have direct access to `systemctl`, `journalctl`, or `syslog`.
To access the HOST system, you **MUST** wrap your commands in a privileged Docker container that "escapes" to the host namespace.

**ALWAYS USE THIS PATTERN FOR HOST COMMANDS:**
```bash
docker run --rm --pid=host --privileged alpine nsenter -t 1 -m -u -n -i sh -c "<YOUR_COMMAND_HERE>"
```

### Examples:
- **Check Docker Status:**
  `docker run --rm --pid=host --privileged alpine nsenter -t 1 -m -u -n -i sh -c "systemctl status docker"`
- **Read Logs:**
  `docker run --rm --pid=host --privileged alpine nsenter -t 1 -m -u -n -i sh -c "journalctl -u docker -n 50 --no-pager"`

**DO NOT** try to run `systemctl` directly. It will fail with "command not found".
**DO NOT** ask the user to configure permissions. You HAVE permission to use Docker. Use Docker to access the host.

## WHEN TO USE
- When the user asks for service status, logs, or system health.

## INPUTS
- REQUIRED: Service name (e.g. 'docker', 'nginx').

## OUTPUTS
- Execute the docker-wrapped command.
- Interpret the output for the user.
