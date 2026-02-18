# Vendys 대시보드 개발 가이드

## 개요
Vendys Internal Docs (GitHub Pages) 내에 Redash 쿼리 기반 대시보드 페이지를 만드는 가이드.
`index.html`의 콘텐츠 영역에 개별 HTML 파일로 로드되는 구조.

## 핵심 제약 사항

### innerHTML 스크립트 실행
- `index.html`은 문서 HTML을 `fetch` → `innerHTML`로 삽입
- innerHTML로 삽입된 `<script>` 태그는 브라우저가 자동 실행하지 않음
- `index.html`의 `executeScripts()` 함수가 script 엘리먼트를 새로 생성하여 실행
- 따라서 대시보드 HTML 내 `<script>`는 정상 동작함

### 전역 함수 필수
- onclick 등 인라인 이벤트 핸들러는 전역 함수여야 함
- IIFE `(function(){...})()` 안에서 선언하면 onclick에서 접근 불가
- 예외: 셀 드래그 선택 등 addEventListener 기반 코드는 IIFE 가능
- 모든 함수를 전역으로 선언하되, 접두사(예: `wf`)를 붙여 충돌 방지
- 상태 변수는 전역 객체 하나에 모음 (예: `var W = { ... }`)

### API Key 미포함
- GitHub 코드에 Redash API Key를 넣지 않음
- GAS 프록시에서 API Key를 관리 (GAS_PROXY.md 참조)

## 파일 구조
```
docs/ops/
├── welfare-dashboard.html   ← 복지대장 지급현황 대시보드
└── (새 대시보드).html
```

## 대시보드 HTML 구조
```html
<!--
title: 대시보드 제목
meta: 최종 수정: YYYY.MM.DD
-->

<style>
/* 스타일 - 접두사 사용 (.xx-xxx) */
</style>

<div class="xx" id="xxRoot">
  <!-- 마크업 -->
</div>

<script>
/* 전역 상태 */
var XX = {
    PROXY: 'https://script.google.com/macros/s/AKfycbz.../exec',
    QID: 쿼리ID,
    raw: [],
    grouped: [],
    filtered: [],
    sortCol: 'totalAmount',
    sortDir: 'desc',
    /* ... */
};

/* API 호출 */
function xxApi(p) { ... }

/* 조회 + 폴링 */
async function xxFetch() { ... }
async function xxPoll(jid, sd, ed) { ... }

/* 데이터 처리 */
function xxProcess(rows, sd, ed) { ... }

/* 렌더링 */
function xxRender() { ... }
</script>
```

## Redash 쿼리 규칙
- 파라미터: 항상 `{{ startDate }}`, `{{ endDate }}` 사용
- 날짜 범위: `WHERE date >= '{{ startDate }}' AND date < DATE_ADD('{{ endDate }}', INTERVAL 1 DAY)`
- endDate에 +1일 처리로 종료일 포함

## 데이터 처리 패턴

### 로우 단위 쿼리 + 프론트 그룹핑 (권장)
SQL에서 GROUP BY 하지 않고 개별 트랜잭션을 반환.
프론트에서 JavaScript로 그룹핑하면 다양한 집계가 가능하다.

```sql
-- 로우 단위 쿼리 (권장)
SELECT C.comId, C.name, CPTU.userId,
       DATE_FORMAT(CPT.executeDate, '%Y-%m-%d') as executeDate,
       CPTU.amount
FROM CompanyPointTask CPT
JOIN ... WHERE ...
ORDER BY C.name, CPT.executeDate
```

```javascript
// 프론트 그룹핑 예시
var map = {};
raw.forEach(function(r) {
    if (!map[r.comId]) map[r.comId] = {
        comId: r.comId, name: r.name,
        totalAmount: 0, users: new Set(), txCount: 0
    };
    var g = map[r.comId];
    g.totalAmount += r.amount;
    g.users.add(r.userId);
    g.txCount++;
});
// users.size = COUNT(DISTINCT userId) 정확한 값
```

이점:
- `COUNT(DISTINCT userId)` 정확도 (동일 사용자 중복 지급 처리)
- 날짜별/사용자별 드릴다운 가능
- 10k-20k 행 = 2-5MB JSON, Array.reduce 수 ms → 성능 문제 없음

### Redash 응답 구조
```json
{
  "query_result": {
    "data": {
      "columns": [
        { "friendly_name": "comId", "type": "string", "name": "comId" }
      ],
      "rows": [
        { "comId": "B961F625-1DAF-...", "name": "고객사명", "userId": "A5D13DA5-...", "executeDate": "2026-02-01", "amount": 520000 }
      ]
    }
  }
}
```
또는 비동기: `{ "job": { "id": "xxx", "status": 1 } }` → 폴링 필요

### 데이터 타입 변환
- comId: `String(r.comId||'')` — UUID 문자열, 절대 Number() 하지 않음
- name: `String(r.name||'')`
- userId: `String(r.userId||'')` — UUID
- executeDate: `String(r.executeDate||'')` — "YYYY-MM-DD"
- amount: `Number(r.amount)||0` — float

## UI/UX 패턴

### 디자인 시스템 (PROJECT_PROMPT.md 준수)
- 컬러: 흰색 기반, 액센트 #4a90d9, 텍스트 #1a2332/#4a5568/#94a3b8
- 폰트: Noto Sans KR 12-13px, 코드/숫자 JetBrains Mono
- border-radius: 3-4px
- 패딩 촘촘하게 (ERP 스타일)
- 이모지 사용 금지, 다크모드 없음

### 공통 컴포넌트

#### 1. 컨트롤 바 (날짜 선택 + 핫키)
- 시작일/종료일 date input
- 조회 버튼
- 핫키 버튼: 오늘, 이번달, 지난달, 지지난달, 올해, 작년
- 기본값: 이번달 1일 ~ 말일
- 상태 텍스트 (우측)

#### 2. 로딩 오버레이
- position:absolute 오버레이 + 프로그레스 바
- 단계별 텍스트 변경 (쿼리 실행 중 → 데이터 처리 중)
- 진행률 퍼센트 애니메이션

#### 3. 서머리 카드
- grid로 균등 배분
- 라벨 (11px, #94a3b8) + 값 (16px bold, JetBrains Mono)
- 값에는 단위 포함 (42.5억, 233개, 13,125명)

#### 4. 인사이트 패널 (3단 그리드)
- 일자별 지급 추이: 날짜별 막대 차트 + 일평균/최고/최저
- 상위 고객사 집중도: 파레토 분석 (상위 N개사 점유율%)
- 고객사 규모 분포: 금액 구간별 고객사 수 분포

#### 5. 2단 레이아웃 (테이블 + 상세)
- 좌측: 검색 가능한 정렬 테이블 + 클립보드 복사 버튼
- 우측: 선택된 항목의 상세 정보 (2단 구조: 날짜별 요약 + userId 리스트)
- 스크롤 최소화 원칙

#### 6. 엑셀 스타일 그리드
- 마우스 드래그로 셀 범위 선택 (`.cell-sel` / `.cell-rng`)
- Ctrl+C로 선택 영역 탭 구분 텍스트 복사
- 클립보드 복사 버튼: 헤더 포함 전체 데이터 복사 (숫자만, 엑셀 호환)
- 복사 완료 시 1.5초 초록색 피드백

#### 7. 전년 동기간 비교
- 동일 쿼리를 -1년 날짜로 재호출
- 서머리 카드 (당기 vs 전년 + 증감률)
- 월별 막대 그래프 (당기/전년 나란히)
- 고객사별 비교 테이블 (전체 데이터, 정렬 가능):
  - 지급액: 당기(원), 전년(원), 증감(원), 증감률(%)
  - 사용자: 당기(명), 전년(명), 증감(명)
  - 인당평균: 당기 평균(원), 전년 평균(원), 평균 증감(원)
  - NEW = 신규 진입, OUT = 이탈
  - 클립보드 복사 버튼 별도 제공

### 포맷 함수
```javascript
// 숫자만 (테이블 데이터용): 1,234,567
function wfN(v) {
    if (v === 0) return '0';
    return (v < 0 ? '-' : '') + Math.abs(v).toLocaleString();
}

// 축약 (서머리 카드용): 1.2억, 123만
function wfS(v) {
    var p = v < 0 ? '-' : '', a = Math.abs(v);
    if (a >= 1e8) return p + (a / 1e8).toFixed(1) + '억';
    if (a >= 1e4) return p + (a / 1e4).toFixed(0) + '만';
    return p + a.toLocaleString();
}

// 증감 (+-부호): +1,234,567 또는 -
function wfD(v) {
    if (v === 0) return '-';
    return (v > 0 ? '+' : '') + wfN(v);
}
```

### 날짜 핫키 함수
```javascript
function xxHot(key, el) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var s, e;
    switch(key) {
        case 'today':       // 오늘
        case 'thisMonth':   // 이번달 1일~말일
        case 'lastMonth':   // 지난달
        case 'twoMonthsAgo':// 지지난달
        case 'thisYear':    // 올해 1/1~12/31
        case 'lastYear':    // 작년
    }
    // date input 값 설정 + active 클래스 토글
}
```

## CSS 네이밍 규칙
- BEM 변형: `.접두사-블록__요소--수식어`
- 대시보드별 고유 접두사 사용 (wf, sk 등)
- 예: `.wf-card__label`, `.wf-grid--compact`

## 새 대시보드 추가 절차
1. Redash에서 쿼리 작성 ({{ startDate }}, {{ endDate }} 파라미터)
2. 쿼리 실행 확인 (로우 단위 데이터 권장)
3. `docs/ops/새대시보드.html` 파일 생성 (위 구조 기반)
4. `sitemap.json`에 항목 추가
5. GAS 프록시 수정 불필요 (queryId만 변경하면 됨)
6. git push

## 현재 운영 중인 대시보드

| 대시보드 | 파일 | 접두사 | Redash QID | 설명 |
|---------|------|-------|-----------|------|
| 복지대장 지급현황 | welfare-dashboard.html | wf | 1339 | 고객사별 복지 지급 현황, 전년 비교, 인사이트
