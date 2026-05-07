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

The template lives at
[`../../docs/templates/user-manifests/`](../../docs/templates/user-manifests/) —
copy it here, run the substitutions described in that template's README,
commit, push. The `swkoo-users` ApplicationSet auto-discovers the new
directory.

For the full onboarding checklist (friend GitHub Actions + manifest
registration), see
[`../../docs/onboarding-friend.md`](../../docs/onboarding-friend.md).

Live reference: [`sungwookoo/`](sungwookoo/) is a real Next.js deployment
serving at `sungwookoo-nextjs-sample.apps.swkoo.kr`.
