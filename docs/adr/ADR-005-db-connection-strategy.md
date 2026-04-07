# ADR-005: DB 연결 전략 — PgBouncer Session Mode Pooler

## 상태

**승인됨** - 2026-04-08

---

## 맥락

CLAIQ 백엔드는 Render free 티어에 배포되고, 데이터베이스는 Supabase PostgreSQL을 사용합니다.
초기 배포 시 Supabase 직접 연결(포트 5432)이 실패하는 문제가 발생했습니다.

Render free 티어는 IPv4 전용이며, Supabase 직접 연결 엔드포인트(`db.<project>.supabase.co`)는
IPv6 우선으로 응답하기 때문에 연결 자체가 성립하지 않았습니다.

### Supabase 연결 방식 3가지

Supabase는 세 가지 연결 엔드포인트를 제공합니다:

| 방식 | 엔드포인트 | 포트 | 특징 |
|------|-----------|------|------|
| 직접 연결 | `db.<project>.supabase.co` | 5432 | IPv6 우선 |
| Transaction mode pooler | `aws-1-ap-northeast-2.pooler.supabase.com` | 6543 | IPv4 지원, 세션 상태 없음 |
| Session mode pooler | `aws-1-ap-northeast-2.pooler.supabase.com` | 5432 | IPv4 지원, 세션 상태 유지 |

### 검토된 선택지

#### 선택지 1: 직접 연결 (포트 5432, db.*.supabase.co)

**장점:**
- 가장 단순한 연결 방식
- 모든 PostgreSQL 기능 사용 가능

**단점:**
- IPv6 우선 응답 → Render free 티어(IPv4 전용)에서 연결 실패
- 실제로 배포 시 `ECONNREFUSED` 또는 타임아웃 발생

#### 선택지 2: Transaction mode pooler (포트 6543)

PgBouncer transaction mode — 쿼리가 완료되면 연결을 즉시 반환.

**장점:**
- IPv4 지원 → Render 환경에서 연결 성공
- 연결 풀 효율 극대화

**단점:**
- 세션 상태 유지 불가 (`SET` 명령어, Prepared Statement, 트랜잭션 간 세션 변수 불가)
- `SET search_path TO claiq, public`을 연결마다 실행해도 다음 쿼리에서 유지 보장 없음
- `SET timezone TO 'Asia/Seoul'` 역시 세션 유지 불가
- `pool.on('connect', ...)` 훅으로 설정한 search_path가 무의미해짐

#### 선택지 3: Session mode pooler (포트 5432, pooler 엔드포인트)

PgBouncer session mode — 클라이언트 연결 수명 동안 서버 연결을 유지.

**장점:**
- IPv4 지원 → Render 환경에서 연결 성공
- 세션 상태 유지 → `SET search_path`, `SET timezone` 정상 동작
- 포트 5432 사용 → 연결 문자열 구조 변경 최소화
- `username` 파싱 방식이 direct 연결과 동일하게 처리됨

**단점:**
- Transaction mode 대비 연결 풀 효율 낮음 (세션당 서버 연결 유지)
- Supabase free 티어는 최대 동시 연결 수 제한 있음

---

## 결정

**Session mode pooler 채택**

```
연결 엔드포인트: aws-1-ap-northeast-2.pooler.supabase.com:5432
```

`pg.Pool` 설정:
```javascript
export const pool = new Pool({
  connectionString: env.db.url,  // pooler 엔드포인트 포함 DATABASE_URL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
})

pool.on('connect', (client) => {
  client.query("SET search_path TO claiq, public; SET timezone TO 'Asia/Seoul'")
})
```

---

## 근거

### 1. IPv4 제약 해소

Render free 티어는 IPv4만 지원합니다.
Supabase pooler 엔드포인트(`*.pooler.supabase.com`)는 IPv4를 지원하므로 연결이 정상적으로 수립됩니다.

### 2. 세션 상태 유지 필수

CLAIQ는 `claiq` 스키마를 사용합니다 (public 스키마와 충돌 방지).
모든 테이블이 `claiq` 스키마에 있으므로, 연결 시 `SET search_path TO claiq, public`이
반드시 유지되어야 합니다.

Transaction mode pooler에서는 이 설정이 트랜잭션 간 유지되지 않아
`claiq` 스키마 테이블을 `schema.table` 형식으로 모두 명시해야 하는 대규모 코드 변경이 필요합니다.

Session mode pooler에서는 `pool.on('connect', ...)` 훅으로 설정한 search_path가 해당 세션 내내 유지됩니다.

### 3. 타임존 일관성

`SET timezone TO 'Asia/Seoul'`을 연결 시 설정하여 모든 `NOW()`, `TIMESTAMP` 연산이
KST 기준으로 일관되게 동작합니다. 이는 출석 체크(`marked_at`), 이탈 감지(`inactive_days` 계산) 등
시간 기반 로직의 정확성에 직접 영향을 미칩니다.

### 4. 변경 최소화

Session mode pooler는 포트 5432를 사용하므로 직접 연결과 `DATABASE_URL` 구조가 동일합니다.
엔드포인트 호스트명만 변경하면 되며, 애플리케이션 코드 수정은 불필요합니다.

---

## 결과

- Render free 티어 배포 후 PostgreSQL 연결 성공
- `claiq` 스키마 search_path 정상 동작 — 모든 쿼리에서 스키마 명시 없이 테이블 접근 가능
- `Asia/Seoul` 타임존 설정 유지 — 시간 기반 비즈니스 로직 정확성 확보
- `withTransaction()` 헬퍼 정상 동작 (BEGIN/COMMIT/ROLLBACK 세션 유지)

---

## 트레이드오프

- Supabase free 티어 최대 동시 연결 수(기본 60개)는 `pg.Pool` max(20)으로 통제
- Transaction mode 대비 연결 풀 효율은 낮지만, CLAIQ 현재 트래픽 규모(공모전 시연 수준)에서는 문제없음
- 향후 트래픽 증가 시 `max` 값 조정 또는 Supabase paid 플랜 전환으로 연결 수 확장 가능
- Render paid 티어 전환 시 IPv4 제약이 해소되므로 직접 연결 재검토 가능
