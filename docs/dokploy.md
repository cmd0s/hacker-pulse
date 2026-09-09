# Dokploy deployment

This Docker target runs a standalone production Node server, without the Sites/ChatGPT sign-in layer. Demo pages and recorded evidence are public at the configured domain; the GitHub repository stays private. Writes still require a visitor's own Tiramisu wallet signature. No test-wallet key, API key, database, persistent volume or runtime secret is needed.

## Dokploy application

- Provider: GitHub, repository `cmd0s/hacker-pulse`, branch `main`.
- Build type: Dockerfile; path `Dockerfile`; build context `.`.
- Application/container port: **3000**.
- Domain: requested demo hostname, path `/`, HTTPS/Let's Encrypt.
- Environment: defaults are included in the image (`NODE_ENV=production`, `PORT=3000`, `HOST=0.0.0.0`).
- Persistent storage: none. Arkiv holds live data; the image includes recorded network evidence.
- Route traffic through Dokploy/Traefik. A host port mapping is not required.

Dokploy's GitHub integration must have read access to this private repository. Keep credentials in the integration, never Docker build arguments or the repository. Configure automatic deployment only if desired; manual deployment is sufficient for this demo.

## Local container check

```sh
docker build -t hacker-pulse:local .
docker run --rm --name hacker-pulse-local -p 127.0.0.1:3080:3000 hacker-pulse:local
```

Open http://localhost:3080. The image runs as the unprivileged `node` user and has an HTTP healthcheck. `.dockerignore` uses an allowlist to exclude `.local`, Git, report screenshots and unneeded sources.

The live station eventually expires (3600 blocks); View before / View after always displays the recorded proof. Visitors may create their own stations and short presences using funded Tiramisu wallets.

## Build targets

`npm run build` preserves the original Cloudflare/Sites target. `npm run build:node` selects native Node standalone output in `dist/standalone`, used by Docker. Both write `dist`, so build one target at a time.
