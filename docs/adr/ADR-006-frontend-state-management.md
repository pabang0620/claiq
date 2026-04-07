# ADR-006: 프론트엔드 상태관리 — Zustand vs Context API vs Redux Toolkit

## 상태

**승인됨** - 2026-04-08

---

## 맥락

CLAIQ 프론트엔드는 운영자(operator), 교강사(teacher), 수강생(student) 3개 역할을 지원하며,
각 역할마다 독립적인 도메인 상태가 존재합니다.

관리해야 하는 상태 영역:

| 도메인 | 주요 상태 |
|--------|----------|
| 인증 (auth) | 로그인 사용자 정보, accessToken, 초기화 여부 |
| 강의 (lecture) | 강의 목록, 업로드 진행 상태, SSE 상태 |
| 문제 (question) | 문제 목록, 검수 상태, 필터 |
| Q&A (qa) | Q&A 목록, 스트리밍 응답 상태 |
| 로드맵 (roadmap) | 학습 로드맵, 진도 |
| 시험 (exam) | 시험 목록, 풀이 상태 |
| 포인트 (point) | 잔액, 거래 내역 |
| UI | 토스트, 사이드바, 다이얼로그 |
| 학원 (academy) | 학원 정보, 멤버 목록 |

상태 변경이 특정 컴포넌트에만 영향을 미쳐야 하고, 불필요한 전체 리렌더링을 방지하는 것이 중요합니다.

### 검토된 선택지

#### 선택지 1: Context API (React 내장)

React 내장 Context와 `useState`/`useReducer` 조합.

**장점:**
- 외부 라이브러리 없음
- React 공식 API

**단점:**
- Context 값이 변경되면 해당 Context를 구독하는 모든 컴포넌트가 리렌더링
- 9개 도메인을 위해 Context를 분리하면 Provider 중첩 깊이 증가
- 선택적 구독(특정 필드만 구독) 기본 미지원 — 커스텀 최적화 필요
- 비동기 로직(API 호출) 처리 패턴이 표준화되어 있지 않음

#### 선택지 2: Redux Toolkit

Redux의 보일러플레이트를 줄인 공식 패키지.

**장점:**
- DevTools 완성도 (타임 트래블 디버깅)
- 미들웨어 생태계 풍부 (RTK Query, redux-thunk 등)
- 대규모 팀 환경에서 일관된 패턴

**단점:**
- `createSlice`, `createAsyncThunk`, `configureStore` 등 보일러플레이트 상당
- 2인 팀 공모전 프로젝트에서 설정 오버헤드가 큼
- 단순 상태 변경에도 action → reducer → selector 패턴 강제
- 번들 크기 증가 (~47KB gzipped)

#### 선택지 3: Zustand v5

경량 상태관리 라이브러리. React 외부에서도 동작하는 단순 스토어.

**장점:**
- 보일러플레이트 최소 — `create()`로 스토어 즉시 생성
- 선택적 구독(selector) 기본 지원 → 관련 상태만 변경 시 해당 컴포넌트만 리렌더링
- React 외부(axios 인터셉터, 이벤트 핸들러)에서도 `useAuthStore.getState()` 직접 접근 가능
- v5에서 `useShallow` API로 얕은 비교 최적화 지원
- 번들 크기 작음 (~1KB gzipped)
- Provider 래핑 불필요

**단점:**
- Redux DevTools 연동은 미들웨어 추가 필요
- 큰 조직에서 스토어 구조 표준화 강제 어려움 (현재 팀 규모에서는 무관)

---

## 결정

**Zustand v5 채택**

```json
"zustand": "^5.0.0"
```

스토어를 도메인별로 분리:

```
front/src/store/
├── authStore.js      # 인증 상태, accessToken
├── lectureStore.js   # 강의 목록, 업로드 상태
├── questionStore.js  # 문제 목록, 검수 상태
├── qaStore.js        # Q&A 목록, 스트리밍 상태
├── roadmapStore.js   # 학습 로드맵
├── examStore.js      # 시험 상태
├── pointStore.js     # 포인트 잔액, 거래 내역
├── uiStore.js        # 토스트, 사이드바, 다이얼로그
└── academyStore.js   # 학원 정보, 멤버 목록
```

---

## 근거

### 1. 보일러플레이트 최소화

2인 팀 공모전 프로젝트에서 개발 속도가 중요합니다.
Zustand는 스토어 정의가 단일 `create()` 호출로 완결됩니다:

```javascript
// authStore.js
export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) => {
    set({ user, accessToken, isAuthenticated: true })
  },
  clearUser: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}))
```

Redux Toolkit이라면 `createSlice` + `createAsyncThunk` + `configureStore` + selector 함수까지 작성해야 합니다.

### 2. 선택적 구독으로 리렌더링 최소화

Context API는 Context 값 일부만 바뀌어도 전체 구독 컴포넌트가 리렌더링됩니다.
Zustand는 selector로 필요한 상태만 구독하면 해당 값이 변경될 때만 리렌더링됩니다:

```javascript
// 사이드바 상태만 구독 → 토스트 변경 시 리렌더링 없음
const sidebarOpen = useUIStore((state) => state.sidebarOpen)
```

### 3. React 외부 접근

Zustand는 훅 외부에서도 스토어 상태에 직접 접근할 수 있습니다.
`useSSE.js`에서 SSE 연결 시 JWT 토큰이 필요한데, 이를 `useAuthStore.getState().accessToken`으로
React 컴포넌트 트리 밖에서 직접 읽을 수 있습니다:

```javascript
// useSSE.js — React 훅 외부에서 토큰 접근
const token = useAuthStore.getState().accessToken
const fullUrl = `${BASE_URL}${url}${token ? `?token=${token}` : ''}`
```

Context API로는 이 패턴이 불가능합니다.

### 4. 도메인별 스토어 분리

9개 도메인을 독립 스토어로 분리하여 관심사를 격리합니다.
각 스토어는 해당 도메인의 상태와 액션만 포함하며, 스토어 간 의존성을 최소화합니다.

---

## 결과

- 9개 도메인 스토어가 각각 독립적으로 관리됨
- 컴포넌트별 선택적 구독으로 불필요한 리렌더링 방지
- `useAuthStore.getState()`를 통한 React 외부 접근 패턴이 `useSSE.js`에서 활용됨
- Zustand v5의 `uiStore`에서 Promise 기반 다이얼로그(`showConfirm`, `showAlert`) 구현

---

## 트레이드오프

- Redux DevTools 수준의 타임 트래블 디버깅은 미지원 (공모전 규모에서 불필요)
- 스토어 간 의존성이 생길 경우 구독 체인이 복잡해질 수 있음 — 현재는 각 스토어가 독립적
- 팀 규모 확장 시 스토어 구조 컨벤션 문서화 필요
