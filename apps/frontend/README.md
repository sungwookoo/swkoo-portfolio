# swkoo-frontend

Next.js(App Router) 기반의 프론트엔드로 `https://swkoo.kr`에 배포될 포트폴리오 및 GitOps 대시보드를 담당합니다. 현재는 백엔드의 `/api/overview` 데이터를 불러와 인프라 개요와 로드맵을 표시하고, 추후 Argo CD 파이프라인 시각화를 추가할 예정입니다.

## 개발
- `.env.local`에 `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api` 설정
- `npm install` 후 `npm run dev`로 개발 서버 실행

## Tailwind & 디자인
- Tailwind CSS로 빠른 프로토타이핑
- 추후 컴포넌트 시스템이 복잡해지면 `packages/ui` 모노레포 패키지로 분리 계획

## 다음 단계
- 파이프라인 타임라인 컴포넌트 구현
- 실시간 업데이트(WebSocket/SSE) 연동 설계
- Observatory 섹션에 Skeleton 로딩/에러 상태 추가
