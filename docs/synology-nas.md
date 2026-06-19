# Synology NAS Deployment

This setup runs Open Design on the NAS and stores all runtime data on the NAS.

## What Gets Stored

The compose file maps:

```text
/volume1/docker/opendesign-data  ->  /data
```

Open Design then writes runtime state to:

```text
/volume1/docker/opendesign-data/.od/
  app.sqlite
  projects/
  artifacts/
```

The container also stores CLI login/config state in:

```text
/volume1/docker/opendesign-data/home/
  .gemini/
  .codex/
  .config/
```

Use the web app for active work. Use RaiDrive mainly to retrieve exported files or inspect project outputs.

## Recommended Access

Do not expose Open Design directly to the public internet. Use one of:

- Tailscale on the NAS and your computers
- Synology VPN
- A reverse proxy with authentication, only if you know the security tradeoffs

## SSH Setup

1. Install Synology Container Manager.
2. Enable SSH temporarily in Synology Control Panel.
3. SSH into the NAS.
4. Put this repository at `/volume1/docker/opendesign`.
5. Create the data folder and start the container:

```sh
mkdir -p /volume1/docker/opendesign-data
cd /volume1/docker/opendesign
docker compose -f docker-compose.synology.yml up -d --build
```

Open:

```text
http://NAS_IP:5821
```

If using Tailscale, open:

```text
http://NAS_TAILSCALE_IP:5821
```

## Container Manager Setup

1. Upload this repository folder to `/volume1/docker/opendesign`.
2. In Container Manager, create a Project.
3. Use `/volume1/docker/opendesign/docker-compose.synology.yml`.
4. Build and start.
5. Open `http://NAS_IP:5821`.

## RaiDrive Notes

Docker and RaiDrive can coexist. The usual problems are port conflicts, NAS firewall rules, or file ownership.

- Do not map Open Design to WebDAV ports `5005` or `5006`.
- Do not map it to DSM ports `5000` or `5001`.
- This compose file exposes Open Design on port `5821`.
- Avoid editing `.od/app.sqlite` through RaiDrive.
- If files are not editable through RaiDrive, set the compose `user:` field to your Synology UID/GID and recreate the container.

To find UID/GID over SSH:

```sh
id your_synology_username
```

Then edit:

```yaml
user: "uid:gid"
```

Restart:

```sh
docker compose -f docker-compose.synology.yml up -d --force-recreate
```

## Local CLI Agents

The Docker image installs:

```text
gemini
codex
```

Open Design can only detect CLIs installed inside the running container. CLIs
installed on your Windows or Mac machine are not visible to the NAS app.

After rebuilding the project, open a terminal in the `open-design` container and
run:

```sh
gemini
codex login
```

Follow each CLI's login instructions. Credentials are stored under the persisted
`/home/opendesign` volume so they survive container recreation.
