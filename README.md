# swkoo.kr 애플리케이션 개요

이 문서는 `https://swkoo.kr` 루트 도메인에 배포할 GitOps 포트폴리오 애플리케이션의 전체 계획을 정리합니다. 이 디렉터리(`swkoo-portfolio/`)는 애플리케이션 전용 저장소 루트로 사용하도록 구성되어 있으며, 백엔드는 NestJS, 프론트엔드는 Next.js(App Router) + TypeScript + Tailwind CSS 조합을 기본 스택으로 사용합니다.

## 장기 목표
- **포트폴리오/소개 페이지**: 개인 인프라 철학, K3s + GitOps 구성요소(Argo CD, Portainer, Grafana, Registry)를 개괄.
- **GitOps 시각화 대시보드**: Argo CD Application 및 배포 이벤트를 수집하여 파이프라인 상태를 실시간에 가깝게 보여줌.
- **확장 가능한 데이터 수집**: 추후 다른 프로젝트(다른 GitOps 파이프라인)까지 포함될 수 있도록 아키텍처를 모듈화.

## 단계별 로드맵

### Phase 1 – 기본 토대 구축
1. **Monorepo 구조 정리**
   - `apps/backend` : NestJS API
   - `apps/frontend`: Next.js(SSR) 프론트엔드
   - `packages/shared`: 공용 타입/유틸 집합(추후 도입)
2. **CI/CD 관점의 요구 정의**
   - Argo CD에서 조회할 Application 목록과 클러스터 네임스페이스 범위 결정.
   - 이벤트 수집 방식(폴링 vs Webhook Relay) 1차 선택.
3. **최소 Landing Page**
   - 인프라 개요, 도메인, GitOps 설명 섹션 탑재.
4. **기본 API**
   - `GET /health` 헬스체크
   - `GET /overview` : 인프라 설명 반환(정적 데이터로 시작)

### Phase 2 – GitOps 이벤트 수집 MVP
1. **Argo CD 연동**
   - 서비스어카운트 + 토큰 발급 → NestJS에서 Argo CD API 호출.
   - `GET /pipelines` : Argo CD Application 상태 목록 반환.
2. **백엔드 저장소**
   - 간단한 in-memory 캐시 + TTL로 시작하고, 필요하면 Redis 등 외부 스토리지 도입.
3. **프론트엔드 시각화**
   - 파이프라인 카드/타임라인 UI 구성.
   - 폴링(예: 15초)으로 Application Sync 상태 갱신.

### Phase 3 – 실시간/확장
1. **실시간 이벤트**
   - Argo CD Webhook → NestJS(또는 별도 이벤트 게이트웨이) → WebSocket/SSE 전송.
2. **여러 CI/CD 소스 통합**
   - GitHub Actions, Portainer Webhook 등 확장.
3. **히스토리/통계**
   - Mongo/Postgres 등 영속 저장소 도입 후 배포 히스토리 시각화.

## 기술 스택 요약
- **Backend**: NestJS, TypeScript, Axios(Argo CD API), class-validator 등 공통 Nest 라이브러리.
- **Frontend**: Next.js(App Router) + TypeScript + Tailwind CSS + Zustand(또는 Redux Toolkit) 상태 관리.
- **통신**: REST API로 시작 → 필요 시 WebSocket/SSE 확장.
- **테스트**: Jest(Nest 기본), Playwright/React Testing Library(프론트).
- **CI/CD**: GitOps 파이프라인에서 빌드 → Docker 이미지 → OCI Registry → Argo CD 배포.

## 인프라 통합 고려사항
- Terraform으로 `swkoo.kr` 애플리케이션 네임스페이스/Ingress/증서를 관리할 모듈 추가.
- OCI Registry와 GitHub Actions/Argo CD 간 인증 전략 정리(서비스 어카운트, ImagePullSecret).
- k3s 클러스터 내 ConfigMap/Secret로 Argo CD API 자격 증명 제공.

## 추후 문서화 계획
- `docs/architecture.md`: 전체 시스템 구성도와 데이터 파이프라인 설명.
- `apps/backend/README.md`: 로컬 개발 방법, 환경변수, 테스트 전략.
- `apps/frontend/README.md`: 디자인 시스템, 페이지 구조, 배포 전략.
