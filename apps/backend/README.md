# swkoo-backend

NestJS 기반의 API 서버로, `https://swkoo.kr` 포트폴리오 애플리케이션에 필요한 인프라 개요 및 GitOps 파이프라인 데이터를 제공합니다. 현재는 `GET /api/overview`, `GET /api/health` 두 엔드포인트로 시작하며 추후 Argo CD 이벤트 수집 기능을 확장할 예정입니다.

## 주요 스크립트
- `npm run start:dev` : 개발 모드(TS → 즉시 실행)
- `npm run build` : `dist/`로 컴파일
- `npm run start` : 컴파일 결과 실행

## 환경 변수
- `PORT` : API 포트(기본 3000)
- `CORS_ORIGINS` : 허용할 오리진 목록(콤마 구분, 기본 `*`)

## 추후 작업
- Argo CD API 연동(`GET /api/pipelines`)
- 배포 이벤트 캐시/저장소 구성
- 인증/인가(필요시)
