# Onboarding a friend onto swkoo.kr

> Phase 1 — admin-driven onboarding for a single friend at a time.
> See [`deploy-vision.md`](./deploy-vision.md) for the broader scope.

This is a step-by-step checklist. The "swkoo" steps you do once per
friend; the "friend" steps the friend does once on their side.

---

## Registry split (Phase 1 decision)

- swkoo's own apps stay on **OCIR** (`nrt.ocir.io/<tenancy>/swkoo/...`)
  — current setup, unchanged.
- The friend pushes to their own **GHCR** (`ghcr.io/<friend-login>/<repo>`).
  Each friend uses their own GitHub account's free quota; swkoo never
  has to manage OCI users or policies for friends.

Why GHCR for friends:
- Zero secrets for the friend (GitHub Actions auto-injects GITHUB_TOKEN
  with packages:write scope on their own repo).
- Public images are unlimited storage + bandwidth on the free plan.
- Private quotas, if needed, count against the friend's account, not
  swkoo's.

---

## What the friend gets

- Their own Kubernetes namespace (`user-<github-login>`) with quotas
- An HTTPS URL (`<app>.apps.swkoo.kr`) auto-issued by Let's Encrypt
- A copy-paste GitHub Actions workflow that builds + pushes their
  image on every commit to `main`

What they don't get (Phase 1):
- Self-service signup (admin onboards manually)
- Stateful storage beyond a 1Gi PVC (no PostgreSQL/MySQL hosting)
- A way to see their own logs through swkoo (use `kubectl logs`
  manually for now)
- Auto-deploy on push (admin syncs once after each push — Phase 1.5b
  will automate this)

---

## Step 1 — friend: drop the workflow into their repo

1. Copy [`docs/templates/friend-build-workflow.yml`](./templates/friend-build-workflow.yml)
   into their repo at `.github/workflows/build.yml`. **No secrets to set**
   — `GITHUB_TOKEN` is provided automatically.
2. Copy [`docs/templates/Dockerfile.node.example`](./templates/Dockerfile.node.example)
   to their repo as `Dockerfile`. Adjust the four marked spots
   (build step, copied dirs, port, start command). Other languages
   work too — anything that builds a Linux/ARM64 image.
3. `git push origin main`. First build typically 2-4 minutes.
4. After the first build, go to **GitHub profile → Packages →
   `<repo>`** and decide visibility:
   - **Public** (recommended for simplicity) — anyone can pull, no
     pull token needed downstream.
   - **Private** — friend generates a Personal Access Token with
     `read:packages` scope and hands it to swkoo for the cluster
     `imagePullSecret`.

---

## Step 2 — swkoo: register the friend's manifests

1. Copy `docs/templates/user-manifests/` → `deploy/users/<github-login>/`.
2. Replace every occurrence of `sample` with `<github-login>` in the
   new directory (covers namespace name, labels, ResourceQuota name, etc.).
3. Replace every occurrence of `hello` with `<friend-app-name>`,
   including renaming the `hello/` folder.
4. In `<app>/deployment.yaml`, set the image and (if needed) port/uid:

   ```yaml
   # REPLACE: ghcr.io/CHANGEME/CHANGEME:latest
   image: ghcr.io/<friend-login>/<repo-name>:latest
   ```

   Defaults assume Node/Next.js: `containerPort: 3000`, `runAsUser: 1000`,
   writable root filesystem. If their stack differs, adjust those.
   `imagePullPolicy: Always` is set so each pod restart pulls the
   fresh `:latest`.
5. In `<app>/ingress.yaml`, pick the host (×2 occurrences) — typically
   `<friend-login>-<app>.apps.swkoo.kr`.
6. **Only if the friend's GHCR package is private**, create the pull
   secret:

   ```bash
   kubectl create secret docker-registry ghcr-pull \
     -n user-<friend-login> \
     --docker-server=ghcr.io \
     --docker-username=<friend-login> \
     --docker-password=<friend-PAT-with-read:packages>
   ```

   And reference it in `deployment.yaml`:

   ```yaml
   spec:
     template:
       spec:
         imagePullSecrets:
           - name: ghcr-pull
   ```

   Public packages need no pull secret at all.
7. Double-check resources / NetworkPolicy still fit the app's needs.
8. `git add deploy/users/<github-login>/ && git commit && git push`.
   The `swkoo-users` ApplicationSet picks the new directory up
   automatically and creates `swkoo-user-<github-login>` (may take
   up to ~3 min for git polling — annotate the ApplicationSet with
   `argocd.argoproj.io/refresh=hard` to force immediate pickup).

---

## Step 3 — first sync + verification

```bash
# On the cluster (swkoo only):
kubectl get application swkoo-user-<github-login> -n argocd
kubectl get all -n user-<github-login>
kubectl get certificate -n user-<github-login>

# Then from anywhere:
curl -I https://<their-app>.apps.swkoo.kr
```

Expected: `HTTP/2 200`. The Observatory page on swkoo.kr will also
show `swkoo-user-<github-login>` as a new pipeline.

---

## Step 4 — subsequent friend pushes (until Phase 1.5b lands)

After the first onboarding, every subsequent friend push:

1. Friend pushes — GitHub Actions rebuilds and overwrites
   `ghcr.io/<friend>/<repo>:latest`.
2. swkoo runs **one** of:

   ```bash
   # Pod restart pulls the fresh :latest
   kubectl rollout restart deployment/<app> -n user-<friend-login>
   ```

   or

   ```bash
   argocd app sync swkoo-user-<friend-login>
   ```

This single manual step disappears once Phase 1.5b adds an automated
deploy-trigger webhook.

---

## Removing a friend

1. `rm -r deploy/users/<github-login>/` and push to main.
2. `swkoo-users` ApplicationSet auto-removes the Application
   (`prune: true` in the template).
3. ArgoCD deletes everything in `user-<github-login>` namespace.
4. Friend retains full control of their GHCR images — they can
   keep, archive, or delete on their side.
5. The wildcard `*.apps.swkoo.kr` covers everything, so no DNS
   cleanup needed.
