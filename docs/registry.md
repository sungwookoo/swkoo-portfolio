# OCI Registry 연동 가이드

## GitHub Actions 시크릿
워크플로 `.github/workflows/docker-publish.yml`에서 사용되는 시크릿 목록입니다.

| Secret Key | 설명 | 예시 |
| --- | --- | --- |
| `OCI_REGISTRY_HOST` | OCIR 엔드포인트 호스트 | `nrt.ocir.io` |
| `OCI_TENANCY_NAMESPACE` | 테넌시 네임스페이스 | `nrznn4yiltsz` |
| `OCI_BACKEND_REPO` | 백엔드 이미지 리포지토리 | `swkoo` |
| `OCI_FRONTEND_REPO` | 프론트엔드 이미지 리포지토리 | `swkoo` |
| `OCI_USERNAME` | OCIR 로그인 ID (`tenancy/username`) | `axxxxdhlru6z/sungwoo.koo` |
| `OCI_AUTH_TOKEN` | 사용자 Auth Token | `ocirt1...` |

> Auth Token은 OCI 콘솔에서 새로 생성할 수 있으며, 만료/회전 정책을 운영 기록에 남겨주세요.

## 로컬 수동 빌드/푸시
```bash
# 로그인
docker login icn.ocir.io -u "<namespace>/<username>" -p "<auth-token>"

# 백엔드
scripts/build-backend.sh nrt.ocir.io/<namespace>/swkoo:backend-test
docker push nrt.ocir.io/<namespace>/swkoo:backend-test

# 프론트엔드
scripts/build-frontend.sh nrt.ocir.io/<namespace>/swkoo:frontend-test
docker push nrt.ocir.io/<namespace>/swkoo:frontend-test
```

## 이미지 태그 전략 제안
- `backend-latest`, `frontend-latest` : 최신 백엔드/프론트엔드 이미지
- `backend-${GITHUB_SHA}`, `frontend-${GITHUB_SHA}` : Git SHA 기반 버전
- Git 태그/환경별 태그: `stage`, `prod`, `canary` 등 필요 시 추가

## 배포 파이프라인 연계
- Argo CD `Application`에서 `image.tag`를 Git SHA 기반으로 지정하면 GitOps 파이프라인과 연동이 쉬워집니다.
- Terraform이나 Helm으로 Argo CD `Application` 매니페스트를 관리할 때, GitHub Actions가 발행한 태그를 자동 갱신하도록 하고 싶다면 Image Updater(Argo CD Image Updater) 사용을 고려하세요.
