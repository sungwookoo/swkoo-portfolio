# swkoo-portfolio 배포 가이드

## 구성
- `base/`: Kustomize 기본 리소스
  - `backend/`: NestJS API Deployment/Service/Ingress (`swkoo-backend`)
  - `frontend/`: Next.js UI Deployment/Service/Ingress (`swkoo-frontend`)
  - `common/namespace.yaml`: `swkoo` 네임스페이스 생성
- `argocd/application.yaml`: Argo CD `Application` 매니페스트

## 선행 조건
- OCI Container Registry 이미지
  - `nrt.ocir.io/<namespace>/swkoo/backend:latest`
  - `nrt.ocir.io/<namespace>/swkoo/frontend:latest`
- 이미지 풀 시크릿: `ocir-credentials`
  ```bash
  kubectl create secret docker-registry ocir-credentials \
    --namespace swkoo \
    --docker-server=nrt.ocir.io \
    --docker-username='<namespace>/<username>' \
    --docker-password='<auth-token>'
  ```
- 백엔드 환경 변수 시크릿: `swkoo-backend-env`
  ```bash
  kubectl create secret generic swkoo-backend-env \
    --namespace swkoo \
    --from-literal=ARGOCD_BASE_URL=https://argocd.swkoo.kr \
    --from-literal=ARGOCD_AUTH_TOKEN=<jwt-token> \
    --from-literal=PIPELINES_CACHE_TTL=15
  ```

> **주의:** OAuth 토큰/비밀번호 등 민감 정보는 Git에 커밋하지 말고 Kubernetes Secret 또는 외부 시크릿 매니저를 사용하세요.

## Kustomize로 직접 배포
```bash
kubectl apply -k deploy/base
```

## Argo CD에 등록
```bash
kubectl apply -f deploy/argocd/application.yaml
```

Argo CD UI에서 `swkoo-portfolio` 애플리케이션을 Sync하면 K3s 클러스터에 프론트/백엔드가 배포됩니다.

## 커스터마이즈 포인트
- 도메인/TLS Secret 이름은 `deploy/base/backend/ingress.yaml`, `deploy/base/frontend/ingress.yaml`에서 변경
- 리플리카 수와 리소스 요청/제한은 각 Deployment에서 조정
- 추가 환경 변수는 Secret/ConfigMap을 만들어 `envFrom` 또는 `env`로 주입
