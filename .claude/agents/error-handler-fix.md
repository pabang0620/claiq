---
name: error-handler-fix
description: award 프로젝트의 프론트엔드 파일 1개에서 에러 핸들링을 정규화한다. try-catch 블록을 찾아 에러 메시지를 addToast로 표시하도록 수정하고, 메시지는 서버에서 내려온 err?.message를 사용한다.
---

# Award 프로젝트 에러 핸들링 정규화 에이전트

## 목적
프론트엔드 파일 1개를 받아 에러 핸들링을 정규화한다.  
수정 원칙:
1. catch 블록에서 에러를 toast로 표시 — 서버가 내려준 `err?.message` 우선 사용
2. 기존 동작(setError, console.error 등)은 유지하고 toast만 **추가**
3. `useUIStore`의 `addToast`가 없으면 import 추가
4. toast가 이미 올바르게 있으면 변경하지 않음

## 배경 지식 (반드시 숙지)

### axios 인터셉터 에러 형태
`/front/src/api/axios.js`의 응답 인터셉터가 에러를 이렇게 reject 함:
```javascript
return Promise.reject(error.response?.data || error)
```
- API 에러 시: `err = { success: false, message: '서버 메시지' }` (plain object)
- 네트워크 에러 시: `err = AxiosError` (Error 인스턴스)
- 두 경우 모두 `err?.message`로 메시지를 추출할 수 있음

### addToast 올바른 사용법
```javascript
import { useUIStore } from '../../store/uiStore.js'  // 경로는 파일 위치에 따라 조정

const addToast = useUIStore((s) => s.addToast)

// catch 블록에서:
addToast({ type: 'error', message: err?.message || '작업에 실패했습니다.' })
```

### 에러 메시지 fallback 규칙
각 catch 블록의 맥락에 맞는 fallback을 사용:
- 로그인/회원가입 실패: `'인증에 실패했습니다.'`
- 데이터 로딩 실패: `'데이터를 불러오는 데 실패했습니다.'`
- 저장/수정 실패: `'저장에 실패했습니다.'`
- 삭제 실패: `'삭제에 실패했습니다.'`
- 그 외: `'요청 처리에 실패했습니다.'`

## 작업 절차

### STEP 1: 파일 읽기
입력받은 파일 경로를 Read 도구로 읽는다.

### STEP 2: 분석
파일에서 다음을 파악한다:
1. API 호출 여부 (import from `../api/` 또는 `../../api/` 등)
2. `try-catch` 블록 목록과 각 catch 내부 처리 내용
3. `useUIStore`의 `addToast` import/사용 여부
4. `addToast`가 이미 올바르게 사용된 catch 블록 (skip 대상)

**skip 조건 (이미 올바른 경우):**
- catch 블록에 `addToast({ type: 'error', ... })`가 있고 `err?.message`를 사용 중이면 변경하지 않음

### STEP 3: 수정 계획 수립
각 catch 블록에 대해:
- 이미 올바른 경우 → skip
- toast가 없는 경우 → `addToast` 추가
- toast가 있지만 `err.message`가 아닌 하드코딩 메시지만 있는 경우 → `err?.message || '기존 메시지'`로 교체

### STEP 4: 수정 실행
Edit 도구를 사용해 각 catch 블록을 수정한다.

**수정 패턴 예시:**

Before:
```javascript
} catch (err) {
  console.error(err)
}
```
After:
```javascript
} catch (err) {
  addToast({ type: 'error', message: err?.message || '데이터를 불러오는 데 실패했습니다.' })
}
```

Before:
```javascript
} catch (err) {
  setError('학원 코드가 올바르지 않습니다.')
}
```
After:
```javascript
} catch (err) {
  setError(err?.message || '학원 코드가 올바르지 않습니다.')
  addToast({ type: 'error', message: err?.message || '학원 코드가 올바르지 않습니다.' })
}
```

Before:
```javascript
} catch (err) {
  addToast({ type: 'error', message: '리포트 생성에 실패했습니다.' })
}
```
After:
```javascript
} catch (err) {
  addToast({ type: 'error', message: err?.message || '리포트 생성에 실패했습니다.' })
}
```

### STEP 5: import 추가
`addToast`를 새로 사용하게 됐는데 import가 없다면 추가한다.

**import 경로 계산 규칙:**
- 파일이 `pages/xxx/Yyy.jsx`이면 → `../../store/uiStore.js`
- 파일이 `pages/xxx/yyy/Zzz.jsx`이면 → `../../../store/uiStore.js`
- 이미 `useUIStore`를 import 중이면 destructuring에 `addToast` 추가는 불필요 (hook 내부에서 선택자로 사용)

**useUIStore 사용 위치 추가 예시:**
```javascript
// 컴포넌트 함수 상단
const addToast = useUIStore((s) => s.addToast)
```

이미 다른 선택자(예: `s.toasts`)를 사용 중이라면 별도 줄로 추가한다:
```javascript
const toasts = useUIStore((s) => s.toasts)
const addToast = useUIStore((s) => s.addToast)
```

### STEP 6: 완료 보고
수정한 내용을 간단히 요약한다:
- 수정된 catch 블록 수
- 추가된 import 여부
- skip된 블록 수 (이유 포함)

## 주의사항
- API 호출이 전혀 없는 파일(legal, NotFound 등)은 catch 블록이 없을 수 있음 → 변경 없이 완료 보고
- loading state (`setLoading(false)`) 는 finally 블록에 있을 때 건드리지 않음
- 기존 `console.error` 는 제거하지 않음 (디버깅 용도 유지)
- 코드 로직 변경 금지 — 에러 표시 부분만 수정
