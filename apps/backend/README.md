# swkoo-backend

NestJS 기반의 API 서버로, `https://swkoo.kr` 포트폴리오 애플리케이션에 필요한 인프라 개요 및 GitOps 파이프라인 데이터를 제공합니다. 현재는 `GET /api/overview`, `GET /api/health` 두 엔드포인트로 시작하며 추후 Argo CD 이벤트 수집 기능을 확장할 예정입니다.

## 주요 스크립트
- `npm run start:dev` : 개발 모드(TS → 즉시 실행)
- `npm run build` : `dist/`로 컴파일
- `npm run start` : 컴파일 결과 실행
- `scripts/build-backend.sh nrt.ocir.io/<namespace>/swkoo:backend-<tag>` : 컨테이너 이미지 빌드

## 환경 변수
- `PORT` : API 포트(기본 3000)
- `CORS_ORIGINS` : 허용할 오리진 목록(콤마 구분, 기본 `*`)
- `ARGOCD_BASE_URL` : Argo CD API 엔드포인트 URL (예: `https://argocd.swkoo.kr`)
- `ARGOCD_AUTH_TOKEN` : Argo CD API 토큰 (`Bearer xyz` 형태)
- `ARGOCD_PROJECTS` *(선택)* : 조회할 프로젝트 슬러그 CSV (기본 전체)
- `PIPELINES_CACHE_TTL` *(선택)* : 파이프라인 응답 캐시 TTL(초, 기본 15)

## 추후 작업
- Argo CD API 연동(`GET /api/pipelines`)
- 배포 이벤트 캐시/저장소 구성
- 인증/인가(필요시)

## Docker 실행 예시
```bash
# 이미지 빌드
scripts/build-backend.sh nrt.ocir.io/<namespace>/swkoo:backend-local

# 컨테이너 실행
docker run --rm -p 3000:3000 \
  -e ARGOCD_BASE_URL=https://argocd.swkoo.kr \
  -e ARGOCD_AUTH_TOKEN=eyJhbGciOi... \
  nrt.ocir.io/<namespace>/swkoo:backend-local
```
