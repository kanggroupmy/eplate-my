# ePlate Platform

The KANG Group monorepo for the public ePlate website, customer ordering app,
staff dashboard, and Cloudflare backend.

## Applications

| Path | Domains | Deployment |
| --- | --- | --- |
| `/` | `eplate.my` | GitHub Pages from `main` and `/root` |
| `apps/order` | `order.eplate.my`, `admin.eplate.my` | Cloudflare Worker named `eplate-order` |

The public website remains at the repository root so its existing GitHub Pages
deployment continues without interruption. The order application retains its
own package, migrations, Worker configuration, and deployment lifecycle under
`apps/order`.

## Deployments

### Public website

GitHub Pages deploys the `main` branch from `/root`. The custom domain is stored
in the root `CNAME` file.

### Order and admin platform

Run Cloudflare commands from `apps/order`:

```sh
cd apps/order
npm ci
npm run deploy
```

If using Cloudflare's Git integration, set the project root directory to
`apps/order`. Database migrations remain in `apps/order/migrations`.

Provider credentials and production tokens must be stored as Cloudflare
secrets, never committed to this repository.
