# GitOps 통합 설계 (MVP)

## 목표
`swkoo.kr` 애플리케이션이 K3s에서 수행되는 GitOps 파이프라인의 상태를 실시간에 가깝게 시각화할 수 있도록 백엔드(NestJS)와 Argo CD를 연동한다.

## 데이터 흐름
1. **Argo CD → NestJS**  
   - NestJS 서비스 계정(SA) 생성 및 `argocd` 네임스페이스에 `ClusterRole` 바인딩.  
   - `argocd login` 대신 HTTPS API 호출을 위해 토큰 시크릿(`argocd-manager-token`)을 발급하고 K8s Secret로 관리.
   - NestJS는 아래 환경 변수를 사용해 인증 정보를 주입받는다.
     | 변수명 | 설명 | 예시 |
     | --- | --- | --- |
     | `ARGOCD_BASE_URL` | Argo CD API 엔드포인트 | `https://argocd.swkoo.kr` |
     | `ARGOCD_AUTH_TOKEN` | Argo CD API 토큰 | `bearer <token>` |
     | `ARGOCD_PROJECTS` *(옵션)* | 조회할 프로젝트 슬러그 CSV | `swkoo,default` |
     | `PIPELINES_CACHE_TTL` *(옵션)* | 캐시 TTL 초 단위 | `15` |

2. **NestJS → Frontend**  
   - `/api/pipelines` 엔드포인트가 Argo CD `applications` API를 호출하여 `health.status`, `sync.status`, `operationState` 정보를 요약.  
   - 응답은 프론트엔드에서 바로 사용 가능한 형태(예: `ApplicationStatusDTO`)로 정규화.

3. **Frontend → 사용자**  
   - Next.js는 SWR/React Query 등을 사용해 15초 폴링으로 `/api/pipelines`를 조회.  
   - 추후 WebSocket/SSE로 전환하여 즉시 업데이트.

## NestJS 모듈 설계
- `PipelinesModule`
  - `ArgoCdClient` : Axios 래퍼, 인증 헤더/에러 처리.
  - `PipelinesService` : Argo CD API 호출(예: `/api/v1/applications?projects=swkoo`), 캐싱, DTO 변환.
  - `PipelinesController` : `GET /pipelines`, `GET /pipelines/:name`.
  - `PipelinesConfig` : `@nestjs/config`를 이용해 환경변수 스키마 유효성 체크.
- `Persistence` (Phase 2 이후 선택)
  - In-memory cache(예: `Map<string, PipelineSnapshot>`) + TTL
  - Redis/Mongo 등 외부 스토리지로 확장 가능.

## Kubernetes 구성 요소
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: swkoo-backend-argocd
  namespace: swkoo
type: Opaque
stringData:
  ARGOCD_BASE_URL: https://argocd.swkoo.kr
  ARGOCD_AUTH_TOKEN: <token>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: swkoo-backend
  namespace: swkoo
spec:
  template:
    spec:
      containers:
        - name: api
          image: <registry>/swkoo-backend:latest
          envFrom:
            - secretRef:
                name: swkoo-backend-argocd
```

## 추후 개선 아이디어
- Argo CD Webhook을 수신하는 `/api/webhooks/argocd` 엔드포인트 추가 → 실시간 상태 갱신.  
- GitHub Actions 빌드 이벤트와 연동하여 Commit → Build → Deploy 전 과정을 타임라인으로 표시.  
- Prometheus에서 Deployment 레이턴시를 가져와 SLA 지표 표시.  
- 사용자 인증(OIDC) 추가로 외부 공개 범위 제한.
