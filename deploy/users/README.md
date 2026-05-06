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

These manifests are not yet wired to ArgoCD — that's the next slice
(Phase 1.4 in [`../../docs/deploy-vision.md`](../../docs/deploy-vision.md)).
