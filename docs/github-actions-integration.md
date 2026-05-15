# GitHub Actions 통합 기획서

> 작성일: 2025-12-20
> 상태: 구현 중

## 개요

swkoo.kr 포트폴리오 대시보드에 GitHub Actions 워크플로 상태를 통합하여, **Commit → Build → Push → Sync → Deploy** 전체 파이프라인을 하나의 타임라인으로 가시화합니다.

## 목표

- OCI 인스턴스를 "어항(Aquarium)"처럼 내부가 훤히 보이도록
- 코드 커밋부터 프로덕션 배포까지 전체 여정을 추적
- DevOps 엔지니어로서의 CI/CD 파이프라인 설계 역량 시각화

## UI 설계

### 타임라인 뷰

```
┌─────────────────────────────────────────────────────────────────────────┐
│  swkoo-kr                                     Synced  Healthy   │
│  default · swkoo                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📍 Pipeline Timeline                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  ● Commit        ● Build         ● Push          ● Sync    ● Run│   │
│  │  ─────●──────────────●──────────────●──────────────●─────────●──│   │
│  │       │              │              │              │         │   │   │
│  │   085cb0df      ✅ 2m 34s      ✅ pushed       ✅ Synced   🟢   │   │
│  │   12/05 21:14   12/05 21:16    12/05 21:17    12/05 21:18       │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  📜 Recent Workflow Runs                              [Filter: All ▼]  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Build and Push Containers  085cb0df  12/05 21:14  2m 34s     │  │
│  │ ✅ Build and Push Containers  3c133fe6  12/05 21:05  2m 12s     │  │
│  │ ✅ Build and Push Containers  83861e38  11/01 17:59  3m 01s     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 필터 옵션

사용자가 Workflow를 필터링할 수 있도록 드롭다운 제공:
- All (전체)
- Build and Push Containers
- (향후 추가되는 다른 Workflow들)

## API 설계

### 새로운 엔드포인트

#### `GET /api/pipelines/:name/workflows`

파이프라인에 연결된 GitHub 저장소의 Workflow 실행 목록을 반환합니다.

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `workflow` | string | - | 특정 워크플로만 필터링 (선택) |
| `per_page` | number | 10 | 페이지당 항목 수 |
| `page` | number | 1 | 페이지 번호 |

**Response:**
```typescript
interface WorkflowRun {
  id: number;
  name: string;                    // "Build and Push Containers"
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  headSha: string;                 // 커밋 해시
  headBranch: string;              // 브랜치명
  event: string;                   // "push", "pull_request" 등
  createdAt: string;
  updatedAt: string;
  runDurationSeconds: number | null;
  htmlUrl: string;                 // GitHub 링크
}

interface WorkflowsEnvelope {
  configured: boolean;
  repoUrl: string | null;
  workflows: string[];             // 사용 가능한 워크플로 이름 목록
  runs: WorkflowRun[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
}
```

## 환경 변수

| 변수 | 필수 | 설명 | 예시 |
|------|------|------|------|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token | `ghp_xxxx` 또는 `github_pat_xxxx` |
| `GITHUB_OWNER` | No | 저장소 소유자 (기본: repoUrl에서 추출) | `sungwookoo` |
| `GITHUB_REPO` | No | 저장소 이름 (기본: repoUrl에서 추출) | `swkoo-kr` |

## 파일 구조

```
apps/backend/src/
├── config/
│   ├── pipelines.config.ts      (기존)
│   └── github.config.ts         (신규)
├── pipelines/
│   ├── services/
│   │   ├── argo-cd.client.ts    (기존)
│   │   └── github.client.ts     (신규)
│   ├── pipelines.controller.ts  (수정)
│   ├── pipelines.service.ts     (수정)
│   └── types/
│       ├── argo-cd.types.ts     (기존)
│       └── github.types.ts      (신규)

apps/frontend/
├── app/
│   └── page.tsx                 (수정)
├── components/
│   ├── PipelineTimeline.tsx     (신규)
│   ├── WorkflowRunList.tsx      (신규)
│   └── WorkflowFilter.tsx       (신규)
└── lib/
    ├── api.ts                   (수정)
    └── types.ts                 (수정)
```

## 구현 단계

### Phase 1: 백엔드 (예상 1시간)
1. GitHub Config 모듈 생성
2. GitHub API 클라이언트 구현
3. Workflows 엔드포인트 추가
4. 필터링 및 페이지네이션 지원

### Phase 2: 프론트엔드 (예상 2시간)
1. 타입 및 API 함수 추가
2. WorkflowRunList 컴포넌트 구현
3. PipelineTimeline 컴포넌트 구현
4. 필터 드롭다운 구현
5. 페이지 통합 및 스타일링

### Phase 3: 배포 (예상 30분)
1. swkoo-backend-env Secret에 GITHUB_TOKEN 추가
2. 백엔드 재배포
3. 프론트엔드 재배포
4. E2E 테스트

## 향후 확장 (Phase 3 연계)

- **실시간 이벤트**: GitHub Webhook → SSE로 워크플로 상태 실시간 업데이트
- **Argo CD Webhook**: Sync 이벤트 실시간 수신
- **K8s Events**: Pod 상태 변화 실시간 스트리밍

## 보안 고려사항

- GitHub Token은 Kubernetes Secret으로 관리
- Public 저장소라도 Rate Limit 때문에 토큰 사용 권장 (60 req/hr → 5000 req/hr)
- 토큰 권한: `repo:status`, `actions:read` 최소 권한만 부여

