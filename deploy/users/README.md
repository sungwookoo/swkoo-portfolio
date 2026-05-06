# Per-user manifests (Phase 1 PaaS)

This directory holds one folder per friend whose app we host. Each folder
follows the same pattern:

```
<github-login>/
├── kustomization.yaml
├── namespace.yaml          # user-<github-login>
├── resource-quota.yaml     # CPU/RAM/PV/Pods caps
├── limit-range.yaml        # default + max per-container
├── network-policy.yaml     # default-deny egress + DNS + 443
└── <app-name>/
    ├── deployment.yaml
    ├── service.yaml
    └── ingress.yaml        # <app>-<...>.apps.swkoo.kr
```

`sample/` is the canonical reference. To onboard a friend:

1. Copy `sample/` → `<friend-login>/`
2. Rename `user-sample` → `user-<friend-login>` in every file
3. Replace the app name `hello` and image with their app
4. Pick subdomain(s) under `apps.swkoo.kr` and update Ingress
5. Add an ArgoCD Application (or ApplicationSet entry) pointing at this folder
6. `kubectl apply` the wildcard cert secret reflection if needed (Phase 1.4)

Wired to ArgoCD via the `swkoo-users` ApplicationSet
([`../argocd/users-applicationset.yaml`](../argocd/users-applicationset.yaml)) —
any directory added under `deploy/users/<login>/` is auto-discovered.

For the full onboarding checklist (OCIR token + friend GitHub Actions
+ manifest registration), see
[`../../docs/onboarding-friend.md`](../../docs/onboarding-friend.md).
