# DEPLOY VISION

> 이 문서는 swkoo.kr **`/deploy`** 진입점(친구 한정 셀프호스트 PaaS 데모)의 정체성·non-goal·성공 기준을 담는다.
> Observatory(`/observatory`)의 [VISION.md](../VISION.md)와 별개이며, Observatory의 non-goals와 충돌하지 않는 범위에서 운영한다.

---

## 1. 한 문장 목적

**swkoo.kr 인프라(OCI A1 / k3s) 위에서 친구가 GitHub repo만 등록하면, 자동으로 빌드·배포돼 외부에서 접근 가능한 URL을 받는다.**

운영 책임은 swkoo 본인이 진다. "셀프호스트 GitOps 운영 사례"의 살아있는 증명으로서 Observatory와 같은 인프라를 공유하지만, 정체성은 다르다.

---

## 2. 청중과 사용 시나리오

- **청중**: swkoo 본인 + 친구 1~2명 (베타). 일반 공개 ❌.
- **이상 사용자**: 바이브코딩으로 작은 앱(Node/Python/Go static)을 만든 초보 개발자.
- **시나리오**:
  1. 친구가 GitHub에 작은 repo를 가지고 있다.
  2. swkoo가 그 repo를 manifests repo에 등록 (Phase 1은 admin 수동, Phase 2부터 OAuth 셀프 등록).
  3. 친구가 `git push` → CI(GitHub Actions, repo의 자체 워크플로) → 이미지 OCIR push → ArgoCD sync → Pod 노출.
  4. 친구는 `<appname>.apps.swkoo.kr` URL로 외부 접근.
  5. 운영자(swkoo)는 Observatory에서 친구의 파이프라인까지 함께 모니터링.

---

## 3. Non-goals — 의도적으로 안 만드는 것

- ❌ **일반 공개 / 셀프 가입** — 친구 1~2명 베타로 시작, 신뢰 기반 등록.
- ❌ **SLA 보장** — 단일 노드, 노드 장애 시 전부 다운.
- ❌ **Stateful 서비스 호스팅** — Phase 1에선 DB 등 stateful 컨테이너 ❌. Phase 2 이후 PV 정책과 함께 검토.
- ❌ **빌드 인프라 자체 운영** — 사용자 GitHub Actions에 위탁. 클러스터 안 자체 빌드(Tekton 등) 안 함.
- ❌ **결제 시스템** — quota는 정적 한도로 통제. 사용자 ↔ 운영자 사이 금전 거래 없음.
- ❌ **상용 PaaS 흉내** — Coolify/Heroku 대체가 아니라 사례 데모.
- ❌ **Observatory의 정체성 침범** — Observatory는 관측·판단 콘솔로 그대로. `/deploy`는 별도 페이지.

---

## 4. 성공 기준 — Phase 1 완료의 정의

1. 친구 1명의 GitHub repo가 등록되어 `git push` 만으로 자동 빌드 → 배포 → URL 노출 흐름 정상 동작.
2. 사용자 namespace 격리 (NetworkPolicy egress 제한 + RBAC).
3. 자원 한도 적용: 사용자당 CPU 0.5 / RAM 512MB / Pods 3 / PV 1GB.
4. 본인 인프라(Observatory + 자체 앱) 영향 없음 — 격리 검증.
5. 운영 비용 0원 유지 (Always Free 한도 안에서).

---

## 5. 아키텍처 (Phase 1, 가장 단순한 형태)

```
[친구의 GitHub repo]
   │  Dockerfile + .github/workflows/build.yml (운영자 제공 템플릿)
   ▼
[GitHub Actions (친구 분량)]
   │  build → push to OCIR (운영자 보조 secret 제공 또는 별도 OCIR 네임스페이스)
   ▼
[OCIR: <namespace>/users/<friend>/<app>:<sha>]
   ▼
[manifests repo: swkoo-portfolio (또는 별도)]
   │  CI bot이 image tag 갱신 (또는 Argo Image Updater)
   ▼
[ArgoCD Application: user-<friend>-<app>]
   │  destination: namespace user-<friend>
   ▼
[k3s namespace: user-<friend>]
   │  ResourceQuota / LimitRange / NetworkPolicy
   │  Deployment + Service + Ingress
   ▼
[Ingress: <appname>.apps.swkoo.kr  (wildcard TLS)]
```

핵심 결정 (Phase 1 단계에서 단순함 우선):
- **wildcard TLS**: cert-manager DNS-01 challenge with `*.apps.swkoo.kr` (별도 와일드카드 인증서)
- **namespace 네이밍**: `user-<github-login>` (1 사용자 = 1 namespace, 그 안에 여러 앱)
- **registry 분리**: swkoo 본인 image는 OCIR(`nrt.ocir.io/...`) 그대로, **친구 image는 친구의 GHCR(`ghcr.io/<friend>/<app>`)**. 친구는 GitHub 안에서 끝나고, swkoo OCI 한도(20GB Object Storage)는 친구가 늘어도 영향 없음.
- **이미지 빌드**: 친구 repo의 GitHub Actions가 자기 GHCR로 push (built-in `GITHUB_TOKEN`, 친구가 추가 secret 등록 불필요)
- **ArgoCD App per user-app**: ApplicationSet으로 자동 생성 (`deploy/users/*` 자동 발견)
- **manifests repo 위치**: 일단 `swkoo-portfolio/deploy/users/<friend>/<app>/` 하위에 두고, Phase 2 이후 별도 repo로 분리 검토

---

## 6. Phase 1 작업 분해

| # | 항목 | 상태 | 검증 |
|---|------|------|------|
| 1.1 | wildcard 도메인 `*.apps.swkoo.kr` + cert-manager DNS-01 | ✅ | `apps-wildcard-tls` Ready (90일 cert) |
| 1.2 | manifests repo 디렉토리 패턴 (`deploy/users/sample/`) | ✅ | kustomize render 정상 (7 리소스) |
| 1.3 | Per-user ResourceQuota / LimitRange / NetworkPolicy 템플릿 | ✅ | sample 디렉토리에 포함 |
| 1.4 | ArgoCD ApplicationSet (deploy/users/* 자동) + sample sync | ✅ | `https://sample-hello.apps.swkoo.kr` HTTP 200 |
| 1.5 | 사용자 GitHub Actions 빌드 템플릿 + onboarding 가이드 | ✅ | `docs/templates/friend-build-workflow.yml`, `docs/onboarding-friend.md` |
| 1.5b | 친구 push 후 자동 sync trigger | ✅ | argocd-image-updater (digest 전략 + argocd write-back) — 수동 rollout 불필요 |
| 1.6 | 친구 1명 실제 등록 + 검증 | ✅ (self-test) | sungwookoo 본인으로 검증, `sungwookoo-nextjs-sample.apps.swkoo.kr` 라이브 |

---

## 7. 알려진 한계 (Phase 1)

- 단일 노드 — 노드 죽으면 친구 앱도 다운.
- Always Free 천장 (4 OCPU / 24GB / Egress 10TB·월).
- 운영 부담 24/7 1인 → 친구 수 제한적.
- 보안 격리는 NetworkPolicy + 자원 한도 1차선뿐 (Trivy/admission webhook은 Phase 2).
- 사용자가 push한 이미지 안의 코드는 검증 안 함 — 신뢰 기반.

---

## 8. Observatory와의 관계

`/deploy`로 등록된 사용자 앱들도 **swkoo k3s 클러스터의 Application**이므로 Observatory의 cross-tool 타임라인에 자동으로 노출된다.

- swkoo-portfolio Application + swkoo-observability Application + 친구 앱 ApplicationSet → Observatory 한 화면에서 함께 본다.
- 운영자(swkoo) 시점에서 "내가 운영하는 모든 것"이 한 화면.
- 친구 시점에서 `/deploy` 페이지는 자기 앱만 본다 (또는 처음엔 외부 노출 없음 — admin-only Phase 1).

---

## 9. 다음 결정 포인트 (이 문서가 채택되면)

- (a) Phase 1.1 wildcard cert 작업 진행 — `*.apps.swkoo.kr` DNS-01 challenge 설정 (terraform-k3s 또는 별도 ArgoCD app)
- (b) sample 사용자 manifests 패턴 PR — `deploy/users/sample/` 디렉토리 + ResourceQuota/NetworkPolicy 템플릿
- (c) "친구 1명" 베타 후보 결정 — 실제 등록 시점에 사용 시나리오가 구체화됨

---

## 10. 사업 전환을 고려하는 경우

이 vision은 **friend-only 베타** 가정 위에 작성되었다. 유료 모델로의 전환을 검토할 때는 [`/BIZ_READINESS.md`](../BIZ_READINESS.md)를 참조한다 — 본 문서 §3의 non-goal 중 일부(특히 SLA 보장, 멀티테넌트 격리, 매니페스트 repo 단일성)가 그 시점에 진실이 되어야 하며, BIZ_READINESS는 그 전환 비용·순서·의존성을 추적한다.

---

## 변경 이력

| 날짜 | 작업 |
|------|------|
| 2026-05-06 | v0 초안 작성 |
| 2026-05-08 | §10 추가 — BIZ_READINESS.md cross-link |
