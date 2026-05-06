# Onboarding a friend onto swkoo.kr

> Phase 1 — admin-driven onboarding for a single friend at a time.
> See [`deploy-vision.md`](./deploy-vision.md) for the broader scope.

This is a step-by-step checklist. The "swkoo" steps you do once per
friend; the "friend" steps the friend does once on their side.

---

## What the friend gets

- Their own Kubernetes namespace (`user-<github-login>`) with quotas
- An HTTPS URL (`<app>.apps.swkoo.kr`) auto-issued by Let's Encrypt
- An OCI Container Registry slot to push images into
- A copy-paste GitHub Actions workflow that builds + pushes on every
  commit to `main`

What they don't get (Phase 1):
- Self-service signup (admin onboards manually)
- Stateful storage beyond a 1Gi PVC (no PostgreSQL/MySQL hosting)
- A way to see their own logs through swkoo (use `kubectl logs`
  manually for now)
- Auto-deploy on push (admin syncs once after each push — Phase 1.5b
  will automate this)

---

## Step 1 — swkoo: issue OCIR credentials

In the OCI console:

1. Identity & Security → Domains → Default → Users → **Create user**
   - Name: `friend-<github-login>`
   - Description: "PaaS friend hosting on swkoo.kr"
2. Under that user → **Auth Tokens** → **Generate Token**
   - Description: `swkoo PaaS push token`
   - Copy the token — it's shown only once
3. Identity → Groups → Create group `swkoo-friends-write` (if not yet)
   and assign the new user to it.
4. Identity → Policies → Add a policy that allows
   `swkoo-friends-write` to `manage repos` only in the friend's
   subpath:

   ```
   Allow group swkoo-friends-write to manage repos in tenancy
     where target.repo.name=/^swkoo\/users\/<github-login>\/.*$/
   ```

   This caps the friend's write to `swkoo/users/<their-login>/*` only.
5. Hand the friend these five values (use a 1Password share or
   similar — don't paste in chat):
   - `OCI_REGISTRY_HOST` — e.g. `nrt.ocir.io`
   - `OCI_TENANCY_NAMESPACE` — e.g. `nrznn4yiltsz`
   - `OCI_USERNAME` — e.g. `<tenancy>/oracleidentitycloudservice/friend-<login>@example.com`
   - `OCI_AUTH_TOKEN` — the token from step 2
   - `OCIR_REPO_PATH` — `swkoo/users/<their-login>/<their-app>`

---

## Step 2 — friend: drop the workflow into their repo

1. Copy [`docs/templates/friend-build-workflow.yml`](./templates/friend-build-workflow.yml)
   into their repo at `.github/workflows/build.yml`.
2. Copy [`docs/templates/Dockerfile.node.example`](./templates/Dockerfile.node.example)
   to their repo as `Dockerfile`. Adjust the four marked spots
   (build step, copied dirs, port, start command) for their app.
   Other languages: any standard Linux/ARM64-compatible image works
   (Python, Go, Rust, …).
3. In GitHub → repo Settings → Secrets and variables → **Actions** →
   add the five secrets from Step 1.
4. `git push origin main`. Watch the Actions tab — first build
   typically 2-4 minutes.
5. Confirm in OCIR: image appears at the path you were given.

---

## Step 3 — swkoo: register the friend's manifests

1. Copy `deploy/users/sample/` → `deploy/users/<github-login>/`.
2. Replace every occurrence of `sample` with `<github-login>` in
   the new directory:
   - namespace: `user-<github-login>`
   - app folder: rename `hello/` to the friend's app name
   - Ingress host: pick a subdomain under `*.apps.swkoo.kr`,
     e.g. `<friend-login>-<app>.apps.swkoo.kr`
3. Update the image reference in `deployment.yaml`:

   ```yaml
   image: nrt.ocir.io/<tenancy>/swkoo/users/<friend-login>/<app>:latest
   imagePullPolicy: Always
   ```

   (The `:latest` tag plus `Always` means the next pod restart
   pulls fresh.)
4. The friend's image is in **a private OCIR repo**. Add an
   `imagePullSecrets` to the Deployment, and create the secret in
   the friend's namespace:

   ```bash
   kubectl create secret docker-registry ocir-credentials \
     -n user-<friend-login> \
     --docker-server=nrt.ocir.io \
     --docker-username=<their OCI_USERNAME> \
     --docker-password=<their OCI_AUTH_TOKEN> \
     --docker-email=<friend-email>
   ```

5. Adjust resources / Ingress host, double-check NetworkPolicy
   still fits the app's needs.
6. `git add deploy/users/<github-login>/ && git commit && git push`.
   The `swkoo-users` ApplicationSet picks the new directory up
   automatically and creates `swkoo-user-<github-login>`.

---

## Step 4 — first sync + verification

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

## Step 5 — subsequent friend pushes (until Phase 1.5b lands)

After the first onboarding, every subsequent friend push:

1. Friend pushes — image rebuilds and `:latest` is overwritten in
   OCIR.
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
4. In OCI: revoke the friend's auth token, optionally delete the
   user and their OCIR repos.
5. Optional: delete the wildcard-matching A record entry if it was
   ever a per-friend record (the `*.apps.swkoo.kr` wildcard already
   covers everything, so usually nothing to do).
