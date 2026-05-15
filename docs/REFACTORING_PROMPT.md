# Observatory 프로젝트 리팩토링 작업 프롬프트

> ⚠️ **Superseded by [`../VISION.md`](../VISION.md)** (2026-04-23)
>
> 이 문서의 방향성·검증 기준은 `VISION.md`로 이관되었습니다. 이 문서는 **과거에 수행한 리팩토링의 기록**이자, 현재 페이지 카피의 근거로만 유지됩니다.
>
> - 새 리팩토링/기능 의사결정은 `VISION.md`를 우선 참조하세요.
> - 이 문서와 VISION이 충돌하면 **VISION이 기준**입니다.
> - 아래 "최종 검증 기준"(회사에 쓸 수 있는가 / 혼자 설계 가능한가 / 중급 이상인가)은 **더 이상 사용하지 않습니다.** 대신 `VISION §4 성공 기준`(B 70% 매일 운영 탭 / A 30% 3분 설계 설명)을 사용하세요.
> - 대부분의 섹션별 지시(Hero, Problem Definition, Design Principles, Trade-offs 등)는 **이미 `app/page.tsx`와 `app/observatory/page.tsx`에 반영되어 있습니다.**

---

## 🎯 작업 목표 (과거 기준 — 참고용)

**핵심 목표**: Observatory는 '보여주기용 프로젝트'가 아니라 '운영 가능한 DevOps 플랫폼'으로 리팩토링한다.

**~~최종 검증 기준 (3개 모두 YES여야 함)~~** — **폐기됨. `VISION §4`의 B/A 성공 기준을 사용할 것.**

~~1. 이걸 실제 회사에 가져다 쓸 수 있는가?~~
~~2. 이 시스템을 혼자 설계·운영했을 것 같은가?~~
~~3. DevOps 중급 이상으로 판단 가능한가?~~

> 폐기 사유: "회사에 쓸 수 있는가"는 Observatory를 오픈소스 제품으로 밀게 만드는 기준이었으나, VISION §3에서 오픈소스 제품화는 non-goal로 확정되었습니다. 대신 "내가 매일 여는 탭인가(B)" + "외부인이 3분 내 설계 의도 요약 가능한가(A)"로 대체합니다.

---

## 📋 현재 프로젝트 상태

### 프로젝트 구조
- **위치**: `C:\sungwoo\swkoo-kr\` (Windows)
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **주요 페이지**:
  - `/` (메인 페이지): `apps/frontend/app/page.tsx`
  - `/observatory` (Observatory 대시보드): `apps/frontend/app/observatory/page.tsx`

### 현재 구현된 기능
- ✅ Argo CD 연동 (`GET /api/pipelines`)
- ✅ GitHub Actions 워크플로 연동 (`GET /api/pipelines/:name/workflows`)
- ✅ Mermaid 아키텍처 다이어그램 (3가지 뷰)
- ✅ Alertmanager → Discord 알람 연동
- ✅ Pipeline Observatory 대시보드
- ✅ Problem Definition / Design Principles / Trade-offs 섹션 (Observatory)
- ✅ Environment Definition 섹션 (메인 페이지)

### 참고 문서
- `swkoo-kr/README.md`: 프로젝트 로드맵
- `swkoo-kr/docs/INDEX.md`: 문서 인덱스
- `작업컨텍스트.md`: 인프라 전체 컨텍스트

---

## 🔴 절대 하지 말 것 (Fail 조건)

다음 중 하나라도 포함되면 **즉시 재작업**:

1. ❌ "포트폴리오용", "포트폴리오 프로젝트입니다" 같은 표현
2. ❌ 기술 스택 나열 위주 설명 (예: "사용 기술: NestJS, Next.js, ...")
3. ❌ 학습 후기, 감상, 튜토리얼 스타일 문구
4. ❌ 회사 프로젝트 아키텍처 상세 서술
5. ❌ 클라우드/온프렘을 흐리게 표현

---

## 📝 작업 지시사항

### 1. 메인 페이지 (`/`) 리팩토링

#### 1.1 Hero Section (최상단) - 필수 변경

**현재 문제점**:
- "안녕하세요, 구성우입니다" 같은 개인 소개 중심
- "포트폴리오" 느낌의 문구

**변경 요구사항**:
```
Observatory
Production-ready DevOps Operations Platform

- OCI IaaS 기반
- Self-managed Kubernetes (k3s)
- Managed Kubernetes / Cloud Monitoring 미사용
- 단일 운영자 기준 설계
```

**톤**: 운영자 시점, 판단 중심, 결과 중심

#### 1.2 Environment Definition 섹션 추가 (필수)

**표 형식으로 명확히 구분**:

| 카테고리 | 사용 기술 | 미사용 기술 |
|---------|----------|------------|
| **Infrastructure** | OCI Compute (VM), OCI Container Registry | - |
| **Container Platform** | Kubernetes (k3s, self-managed) | Managed Kubernetes (OKE/EKS/GKE) |
| **CI/CD** | GitHub Actions (CI), Argo CD (CD, GitOps) | Cloud-native CI services |
| **Observability** | Prometheus, Grafana, Alertmanager | Cloud-native Monitoring |

**핵심**: "어디까지 직접 책임졌는지"가 한눈에 보여야 함

#### 1.3 기존 섹션 수정

- **Skills Section**: 기술 나열 위주 → 운영 책임 범위 중심으로 재작성
- **Infrastructure Overview**: "홈 랩 환경" 같은 표현 제거, 운영 플랫폼 관점으로 변경
- **Featured Project**: "어항처럼 투명하게" 같은 비유 제거, 실무 문제 해결 관점으로 변경

---

### 2. Observatory 페이지 (`/observatory`) 리팩토링

#### 2.1 Problem Definition 섹션 추가 (필수)

**위치**: Observatory 페이지 상단 (Hero 아래)

**내용** (bullet 기반, 실무 문제로 서술):
- 서비스 수 증가에 따른 CI/CD 파이프라인 분산
- 장애 발생 시 원인 추적 어려움
- 운영 인력 1인 전제 환경에서의 효율성 필요

**금지**: "학습 목적", "포트폴리오용", 회사 언급

#### 2.2 Design Principles 섹션 추가 (필수)

**최소 4개 이상 명시**:
1. Git-based operations
2. Manual operation minimization
3. Fast root cause analysis
4. Resource-constrained environment consideration

**형식**: 각 원칙에 대해 "왜 선택했는지" 판단 근거 포함

#### 2.3 Architecture Section 개선

**현재**: Mermaid 다이어그램만 있음

**추가 필요**:
- 데이터/이벤트 흐름 설명 (Code → CI → Image → CD → Runtime → Monitoring)
- 실패/알림 흐름 설명
- ❌ 컴포넌트 나열만 하는 설명 금지

#### 2.4 CI/CD 섹션 추가 (필수)

**"운영 시나리오" 중심으로 작성**:

다음 질문에 답해야 함:
1. PR 머지 시 어떤 단계가 자동 실행되는가?
2. 실패 시 무엇이 중단되는가?
3. 롤백은 어떻게 이루어지는가?
4. 배포 후 모니터링은 어떻게 연결되는가?

**금지**: 툴 설명만 나열

#### 2.5 Observability 섹션 추가 (필수)

**결과 중심으로 작성**:

- 어떤 메트릭을 보는지 (구체적 예시)
- 어떤 알람이 실제로 울리는지 (Alertmanager 규칙 참조)
- 알람 후 어떤 판단을 하는지 (Runbook 스타일)
- 스크린샷 or 예시 필수 (Grafana 대시보드, Alertmanager 설정 등)

**참고**: 
- Alertmanager 설정: `monitoring` namespace
- 커스텀 알람 규칙: `swkoo-application-alerts` PrometheusRule
- Discord Webhook 연동 완료

#### 2.6 Trade-offs 섹션 추가 (필수)

**시니어 시그널을 보여주는 섹션**:

반드시 포함:
- 선택하지 않은 옵션 (예: HA, Managed 서비스)
- 그 이유 (비용, 복잡도, 단일 운영자 환경 등)
- 감수한 리스크

**예시**:
- HA 미구현 이유: 단일 노드 환경, 비용 대비 가치
- Managed 서비스 미사용 이유: 직접 운영 경험 증명, 비용 절감
- 단일 클러스터 선택 이유: 리소스 제약, 운영 복잡도 최소화

---

### 3. 문구/톤 가이드

#### ✅ 사용할 톤
- 운영자 시점: "우리는 X를 선택했다"
- 판단 중심: "Y보다 Z를 선택한 이유는..."
- 결과 중심: "이로 인해 A가 가능해졌다"

#### ❌ 금지 톤
- 학습 후기: "배웠다", "공부했다"
- 감상: "재미있었다", "도전적이었다"
- 튜토리얼: "이렇게 하면 됩니다"

---

### 4. Side Projects 처리 (향후 확장 고려)

**원칙**:
- Observatory = 플랫폼
- 다른 프로젝트 = 테넌트

**표현 방식**:
- "Observatory에서 실제로 배포·운영되는 서비스 중 하나"
- 단순 예제 ❌
- 실제 배포 파이프라인 포함 ⭕

---

### 5. 회사 경험 처리 (현재는 미포함, 향후 확장 시)

**허용**:
- Experience 섹션 1~2줄 요약
- 기술적 디테일 없음

**금지**:
- 회사 프로젝트 아키텍처 상세
- 성과 수치
- 내부 시스템 설명

---

## 🔍 작업 검증 체크리스트 (이력)

초기 리팩토링 시점 기준. 대부분 **완료**되어 현재 페이지 구조에 반영되어 있습니다.

### 메인 페이지 (`/`)
- [x] Hero Section에 "OCI IaaS 기반", "Self-managed Kubernetes", "Managed K8s 미사용" 명시
- [x] "포트폴리오" 단어 제거
- [x] Environment Definition 섹션 추가 (표 형식)
- [x] 기술 나열 위주 → 운영 책임 범위 중심으로 변경

### Observatory 페이지 (`/observatory`)
- [x] Problem Definition 섹션 추가 (실무 문제)
- [x] Design Principles 섹션 추가 (최소 4개)
- [x] Architecture Section에 데이터 흐름 설명 추가
- [x] CI/CD 섹션 추가 (운영 시나리오 중심)
- [x] Observability 섹션 추가 (결과 중심, 예시 포함)
- [x] Trade-offs 섹션 추가 (선택하지 않은 옵션 + 이유)

### 문구/톤
- [x] "포트폴리오" 관련 표현 제거
- [x] 학습/감상 톤 제거
- [x] 운영자 시점, 판단 중심 톤 사용

### ~~최종 검증~~ (폐기 — `VISION §4`로 대체)
- ~~실제 회사에 가져다 쓸 수 있는가?~~ → VISION §3에서 오픈소스 제품화는 non-goal
- 대체 기준: **B(매일 여는 운영 탭) 70% + A(3분 설계 설명) 30%**

---

## 📁 작업 대상 파일

### 필수 수정 파일
1. `apps/frontend/app/page.tsx` - 메인 페이지
2. `apps/frontend/app/observatory/page.tsx` - Observatory 페이지

### 참고 파일 (읽기 전용)
- `apps/frontend/components/ArchitectureDiagram.tsx` - 다이어그램 컴포넌트
- `apps/frontend/components/PipelineCard.tsx` - 파이프라인 카드
- `swkoo-kr/README.md` - 프로젝트 로드맵
- `작업컨텍스트.md` - 인프라 컨텍스트

---

## 🚀 작업 시작 전 확인사항

1. **현재 코드베이스 파악**
   ```bash
   cd C:\sungwoo\swkoo-kr
   # 메인 페이지와 Observatory 페이지 구조 확인
   ```

2. **타겟 독자 명확히**
   - DevOps 채용 담당자
   - 인프라/플랫폼 팀장급 실무자
   - "혼자 운영 가능한 DevOps 엔지니어인가?" 판단자
   - ❌ 초보자/학습자 기준 설명 금지

3. **톤 가이드 준수**
   - 운영자 시점
   - 판단 중심
   - 결과 중심

---

## 📝 작업 완료 후

1. **빌드 테스트**
   ```bash
   cd apps/frontend
   npm run build
   ```

2. **검증 체크리스트 확인**
   - 위의 체크리스트 모두 확인

3. **커밋 메시지 예시**
   ```
   refactor: transform Observatory from portfolio to production-ready platform
   
   - Rewrite hero section with production-ready messaging
   - Add Environment Definition section (explicitly NOT used)
   - Add Problem Definition, Design Principles, Trade-offs sections
   - Rewrite CI/CD and Observability sections (scenario-based)
   - Remove all "portfolio" references
   - Change tone to operator perspective, decision-focused
   ```

---

## ⚠️ 주의사항

1. **기존 기능 유지**: 파이프라인 대시보드, 다이어그램 등 기존 기능은 그대로 유지
2. **UI/UX 일관성**: Tailwind CSS 스타일 가이드 유지
3. **한국어 사용**: 모든 텍스트는 한국어로 작성
4. **타겟 독자**: 초보자가 아닌 실무자/채용 담당자 기준

---

**작업 시작**: 위 지시사항을 따라 메인 페이지와 Observatory 페이지를 전면 리팩토링하세요.

