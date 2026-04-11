# CLAIQ - AI 에이전트 협업 기록

## 개요

CLAIQ는 단순히 AI API를 호출하는 것에 그치지 않고, **AI 에이전트 오케스트레이션** 방식으로 개발되었습니다. 메인 Claude(오케스트레이터)가 전체 흐름을 설계하고, 각 도메인 전문 에이전트에게 실제 구현을 위임하는 구조입니다. 이를 통해 각 에이전트가 자신의 전문 영역에 집중하면서도, 프로젝트 전체가 일관된 아키텍처를 유지할 수 있었습니다.

> **오케스트레이터 원칙**: 메인 Claude는 코드를 직접 작성하지 않습니다. 모든 코드 변경은 전문 에이전트에 위임합니다.

---

## 사용된 전문 에이전트 목록

### 1. `planner` - 구현 계획 수립
새로운 기능을 개발하기 전 항상 먼저 실행했습니다. 강의 업로드 파이프라인, RAG Q&A 시스템, 학습 로드맵 생성 등 복잡한 기능마다 단계별 구현 계획을 먼저 수립하고, 의존성과 위험 요소를 식별했습니다.

### 2. `architect` - 시스템 설계
전체 시스템 아키텍처를 결정하는 단계에서 활용했습니다. AI 파이프라인 구조(STT → 임베딩 → 벡터 저장 → 문제 생성), Human-in-the-Loop 설계, 에스컬레이션 정책 등 핵심 설계 결정에 참여했습니다.

### 3. `express-engineer` - Node.js + Express API 구현
백엔드 전체를 담당했습니다. OpenAI Whisper STT 연동, pgvector 임베딩 저장, GPT-4o 문제 생성 API, SSE(Server-Sent Events) 실시간 진행상황 전송, RAG Q&A 엔드포인트 등을 구현했습니다.

### 4. `react-specialist` - React 19 컴포넌트 개발
프론트엔드 전체를 담당했습니다. 강의 업로드 UI, 문제 검수 인터페이스(승인/수정/반려), AI Q&A 채팅 컴포넌트, 학습 로드맵 시각화, 미니 모의고사 응시 화면 등을 React 19 최신 API를 활용해 구현했습니다.

### 5. `database-reviewer` - PostgreSQL 스키마 설계
pgvector 확장을 포함한 데이터베이스 스키마를 설계하고 검토했습니다. 임베딩 테이블 구조(1536차원 벡터), 문제 유형/난이도 분류 테이블, 학생 약점 통계 테이블(student_type_stats) 등의 설계에 참여했으며, 인덱스 전략과 쿼리 최적화도 담당했습니다.

### 6. `security-reviewer` - 보안 취약점 검토
OpenAI API 키 관리, 파일 업로드 검증(음성 파일 크기/형식 제한), JWT 인증 흐름, SQL 인젝션 방지, 환경변수 처리 등을 검토했습니다. 특히 교강사/수강생 역할 기반 접근 제어(RBAC) 설계를 검증했습니다.

### 7. `build-error-resolver` - 빌드 에러 해결
pgvector 의존성 설정, OpenAI SDK 버전 호환성 문제, Vite 빌드 최적화 오류 등 개발 과정에서 발생한 빌드 에러를 신속하게 해결했습니다.

### 8. `tdd-guide` - 테스트 주도 개발
핵심 기능(문제 생성 파이프라인, RAG 검색 정확도, 난이도 분류 로직)에 대해 테스트를 먼저 작성하고 구현하는 TDD 워크플로우를 가이드했습니다. 프로젝트 특성상 별도의 테스트 파일은 작성되지 않았으며, 로직 검증은 직접 실행과 시드 데이터를 통해 진행했습니다.

### 9. `refactor-cleaner` - 코드 정리
초기 프로토타입 코드에서 중복 로직 제거, 함수 분리, 파일 크기 최적화(800줄 이하 유지) 등의 리팩토링을 수행했습니다. 불변성 패턴 적용과 불필요한 콘솔 로그 제거도 담당했습니다.

### 10. `doc-updater` - 문서 업데이트
API 문서, ADR(Architecture Decision Record), AI 파이프라인 문서 등 기술 문서를 최신 상태로 유지했습니다. 코드 변경 후 자동으로 관련 문서를 업데이트하는 역할을 수행했습니다.

---

## 병렬 에이전트 실행 전략

CLAIQ 개발에서 독립적인 작업은 반드시 병렬로 실행했습니다. 이를 통해 개발 속도를 크게 높일 수 있었습니다.

### 병렬 실행 예시

**초기 설계 단계 - 3개 에이전트 동시 실행:**
```
병렬 실행:
├── architect        → 전체 시스템 아키텍처 설계
├── database-reviewer → 데이터베이스 스키마 초안 작성
└── security-reviewer → 보안 요구사항 사전 정의
```

**기능 구현 후 검증 단계 - 3개 에이전트 동시 실행:**
```
병렬 실행:
├── security-reviewer → 보안 취약점 스캔
├── tdd-guide         → 테스트 커버리지 확인
└── refactor-cleaner  → 코드 품질 검토
```

**문서화 단계 - 병렬 처리:**
```
병렬 실행:
├── doc-updater (AI 파이프라인 문서)
├── doc-updater (API 엔드포인트 문서)
└── doc-updater (ADR 문서 3개)
```

---

## 에이전트 협업 워크플로우 예시: 강의 업로드 기능

강의 업로드 → AI 문제 자동 생성 기능을 개발한 전체 과정입니다.

### 1단계: 계획 수립 (planner)
```
planner 에이전트 실행
→ 강의 파일 업로드 흐름 분석
→ Whisper STT 청크 분할 전략 수립 (25MB 제한 대응)
→ 임베딩 배치 처리 계획 (rate limit 대응)
→ SSE 실시간 진행상황 전송 방식 결정
→ 단계별 구현 계획 5개 Phase 도출
```

### 2단계: 아키텍처 결정 (architect)
```
architect 에이전트 실행
→ AI 파이프라인 레이어 분리 설계
→ 비동기 처리 구조 결정 (Bull MQ vs 직접 처리)
→ Human-in-the-Loop 검수 플로우 설계
→ 에스컬레이션 정책 (신뢰도 기준) 정의
```

### 3단계: 스키마 설계 (database-reviewer)
```
database-reviewer 에이전트 실행
→ lectures, lecture_chunks 테이블 설계
→ questions, question_options, answer_submissions 테이블 설계
→ pgvector 인덱스 전략 (ivfflat, cosine distance)
→ 소프트 삭제 패턴 적용
```

### 4단계: 백엔드 구현 (express-engineer)
```
express-engineer 에이전트 실행
→ POST /api/lectures/upload 엔드포인트 구현
→ Whisper STT 통합 (청크 분할, 재시도 로직)
→ 임베딩 생성 및 pgvector 저장
→ GPT-4o 문제 생성 (수능 유형 프롬프트)
→ GET /api/lectures/:id/progress SSE 엔드포인트 구현
```

### 5단계: 프론트엔드 구현 (react-specialist)
```
react-specialist 에이전트 실행
→ 파일 드래그앤드롭 업로드 컴포넌트
→ SSE 기반 실시간 진행률 표시 (useEffect + EventSource)
→ 문제 미리보기 및 검수 인터페이스
→ React 19 use() Hook 활용한 데이터 페칭
```

### 6단계: 보안 및 테스트 (병렬 실행)
```
병렬 실행:
├── security-reviewer → 파일 업로드 취약점 검토, API 키 노출 여부 확인
└── tdd-guide         → 파이프라인 단계별 단위 테스트 작성
```

### 7단계: 코드 정리 및 문서화 (병렬 실행)
```
병렬 실행:
├── refactor-cleaner → 중복 코드 제거, 함수 분리
└── doc-updater      → API 문서, 파이프라인 문서 업데이트
```

---

## AI 협업의 주요 성과

### 개발 품질
- **전문성 집중**: 각 에이전트가 자신의 도메인(보안, DB, 프론트엔드 등)에 집중하여 일반적인 단독 개발 대비 높은 코드 품질 달성
- **일관성 유지**: 오케스트레이터가 전체 흐름을 관리하여 서로 다른 에이전트가 작성한 코드 간의 일관성 보장
- **조기 오류 발견**: TDD 에이전트와 security-reviewer가 구현 초기에 잠재적 문제를 발견하여 수정 비용 최소화

### 개발 속도
- **병렬 실행**으로 독립적인 작업(프론트엔드/백엔드/DB)을 동시에 진행, 순차 개발 대비 개발 기간 단축
- planner 에이전트의 사전 계획으로 구현 중 설계 변경 최소화

### 아키텍처 결정
- architect + database-reviewer 협업으로 **pgvector 기반 RAG 아키텍처** 결정 - Fine-tuning 대비 강의별 최신 내용 즉시 반영 가능
- Human-in-the-Loop 설계를 초기 아키텍처에 포함하여 교육 신뢰도 확보

### 비용 효율
- security-reviewer와 architect 협업으로 gpt-4o 우선 사용 전략 수립 (gpt-4o 대비 비용 절감)
- 임베딩 배치 처리와 캐싱 전략으로 불필요한 API 호출 최소화
