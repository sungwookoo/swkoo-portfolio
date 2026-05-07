# Per-user manifests template

Copy this directory to `deploy/users/<github-login>/` when onboarding a
friend. ApplicationSet picks up the new directory automatically and creates
`swkoo-user-<login>` pointing at it.

## Substitution

Two find-and-replace passes cover the entire template:

| From            | To                                       |
|-----------------|------------------------------------------|
| `sample`        | `<friend-github-login>`                  |
| `hello`         | `<friend-app-name>` (also rename folder) |

Plus three values that have no automatic substitution:

| File                  | Field                | Action                                    |
|-----------------------|----------------------|-------------------------------------------|
| `<app>/deployment.yaml` | `image`              | `ghcr.io/<friend>/<repo>:latest`         |
| `<app>/deployment.yaml` | `containerPort`      | match the friend's `Dockerfile EXPOSE`   |
| `<app>/deployment.yaml` | `runAsUser`          | non-root uid in their base image (1000 = node alpine) |
| `<app>/ingress.yaml`    | host (×2 occurrences) | pick a subdomain under `*.apps.swkoo.kr` |

## Defaults are tuned for Node/Next.js

The template assumes a typical Node app: port 3000, uid 1000, writable root
filesystem. For other stacks adjust the `securityContext` and ports.
`readOnlyRootFilesystem` is intentionally OFF — most frameworks need to
write at runtime (Next.js cache, Python `__pycache__`, JIT scratch). Re-enable
only if the app is verified read-only-safe.

## Why we don't ship a "live sample" anymore

Earlier this directory lived at `deploy/users/sample/` and double-served as
both the template AND a deployed `traefik/whoami` smoke test. The dual role
forced the template to use values (port 80, uid 65534, read-only FS) that
didn't match real Node apps, so every onboarding required rewriting them.
The live reference is now `deploy/users/sungwookoo/` — a real Next.js
deployment at `sungwookoo-nextjs-sample.apps.swkoo.kr`.
