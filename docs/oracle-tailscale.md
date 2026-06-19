# Oracle Server Deployment via Tailscale

This setup runs Open Design on an Oracle Linux/Ubuntu server and exposes it
only on the server's Tailscale IP.

## Access Model

Use this address from your own devices after they join the same Tailscale tailnet:

```text
http://ORACLE_TAILSCALE_IP:5821
```

Do not open port `5821` in Oracle Cloud public ingress rules. The compose file
binds the Docker port to `TAILSCALE_IP` only.

## Server Setup

Install Docker and Tailscale on the Oracle server, then confirm the Tailscale IP:

```sh
tailscale ip -4
```

Create a `.env` file next to `docker-compose.oracle-tailscale.yml`:

```sh
TAILSCALE_IP=100.x.y.z
```

Create persistent storage:

```sh
sudo mkdir -p /opt/gooday/docker/open-design/data /opt/gooday/docker/open-design/home
```

Build and start:

```sh
docker compose -f docker-compose.oracle-tailscale.yml up -d --build
```

Open:

```text
http://100.x.y.z:5821
```

## Codex Login

Open a shell inside the running container:

```sh
docker exec -it open-design bash
```

Then authenticate Codex:

```sh
codex login
```

The login state is stored under:

```text
/opt/gooday/docker/open-design/home/.codex
```

So it survives container rebuilds and restarts.

## Grok OAuth Proxy

This deployment can also use the existing Gooday Grok OAuth proxy as an
OpenAI-compatible API provider:

```text
base URL: http://100.67.14.65:8300/v1
model:    grok-4.3
```

In Open Design, switch to API mode and use the quick provider:

```text
Grok (Gooday OAuth Proxy)
```

The browser stores only the `__server_managed__` marker. The actual proxy API
key stays on the Oracle server and is injected by the daemon only for the
trusted Grok proxy URL.

The Open Design compose service reads only this single-key env file:

```text
/opt/gooday/docker/open-design/secrets/grok-proxy.env
```

Do not print or commit that file.

## Data Location

Open Design stores app data in:

```text
/opt/gooday/docker/open-design/data/.od/app.sqlite
/opt/gooday/docker/open-design/data/.od/projects/
/opt/gooday/docker/open-design/data/.od/artifacts/
```

Back up `/opt/gooday/docker/open-design/data` and `/opt/gooday/docker/open-design/home` regularly.

## Safety Checklist

- Keep Oracle Cloud ingress for port `5821` closed.
- Connect through Tailscale from your own devices.
- Do not edit `app.sqlite` directly.
- Use the Open Design app to open/edit projects.
- Back up `/opt/gooday/docker/open-design/data` and `/opt/gooday/docker/open-design/home`, especially before rebuilding from a newer source.
