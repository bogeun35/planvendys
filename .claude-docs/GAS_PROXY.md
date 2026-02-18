# Google Apps Script (GAS) Redash Proxy 가이드

## 개요
GitHub Pages에서 Redash API를 직접 호출하면 CORS 에러가 발생한다.
GAS 웹 앱을 프록시로 사용하여 우회한다.

## 현재 배포 정보
- 배포 ID: `AKfycbzyZ3GkPnU_1D_gax47Fa96GGCz-kVJU3QReBIoMzLo54PcfONtFe_h7QS2vRNxTZq3`
- 전체 URL: `https://script.google.com/macros/s/AKfycbzyZ3GkPnU_1D_gax47Fa96GGCz-kVJU3QReBIoMzLo54PcfONtFe_h7QS2vRNxTZq3/exec`

## 아키텍처
```
브라우저 (GitHub Pages)
    ↓ fetch (GET only, redirect:'follow')
GAS 웹 앱 (doGet)
    ↓ UrlFetchApp (GET/POST)
Redash API (redash.sikdae.com)
```

## API Key 관리
- API Key는 GAS 코드 내부의 CONFIG 객체에 저장
- GitHub 코드에는 API Key를 절대 포함하지 않음
- User API Key 사용 (파라미터 있는 쿼리 실행에 필수)

## GAS 코드 구조
```javascript
var CONFIG = {
  REDASH_BASE: 'https://redash.sikdae.com',
  USER_API_KEY: '사용자_API_KEY'
};

function doGet(e) {
  var action = e.parameter.action;
  // action에 따라 Redash API 호출
  // 결과를 JSON으로 반환
}
```

## 파라미터 전달 방식

### 동적 파라미터 (현재 구조)
GAS는 예약 파라미터 4개(`action`, `queryId`, `jobId`, `resultId`)를 제외한 **모든 파라미터를 자동으로 Redash에 전달**한다.
새 쿼리에 파라미터가 추가되더라도 GAS 수정이 불필요하다.

```javascript
// GAS 내부 처리 (case 'post')
var params = {};
var reserved = ['action', 'queryId', 'jobId', 'resultId'];
Object.keys(e.parameter).forEach(function(k) {
  if (reserved.indexOf(k) === -1) {
    params[k] = e.parameter[k];
  }
});
options.payload = JSON.stringify({
  parameters: params,
  max_age: 1800
});
```

### 예약 파라미터 (GAS 프록시용)
| 파라미터 | 용도 |
|---------|------|
| `action` | GAS 동작 지정 (post, job, result) |
| `queryId` | Redash 쿼리 ID |
| `jobId` | 비동기 Job ID (폴링용) |
| `resultId` | 쿼리 결과 ID |

### Redash 쿼리 파라미터 (그대로 전달)
위 4개를 제외한 나머지는 전부 Redash `parameters`로 전달된다.

```javascript
// 클라이언트 호출 예시 - 기본 (startDate, endDate)
xxApi({ action:'post', queryId:1339, startDate:'2026-01-01', endDate:'2026-01-31' });

// 클라이언트 호출 예시 - 파라미터 추가 (GAS 수정 불필요)
xxApi({ action:'post', queryId:1340, startDate:'2026-01-01', endDate:'2026-01-31', companyId:'xxx', status:'ACTIVE' });
```

## 호출 규격 (클라이언트 → GAS)
모든 요청은 GET으로만 보낸다 (GAS POST는 CORS 리다이렉트 문제 있음).

### 쿼리 실행 (POST 프록시)
```
?action=post&queryId=1339&startDate=2026-01-01&endDate=2026-01-31
```
- GAS 내부에서 Redash `/api/queries/{id}/results`에 POST
- 예약 파라미터 제외한 나머지를 `parameters`로 전송

### Job 폴링
```
?action=job&jobId=xxx
```
- `job.status === 3` → 완료, `query_result_id` 사용
- `job.status === 4` → 실패

### 결과 조회
```
?action=result&resultId=xxx
```

## 클라이언트 호출 패턴
```javascript
// 공통 API 함수
function xxApi(params) {
  var qs = Object.keys(params)
    .map(function(k) { return k + '=' + encodeURIComponent(params[k]) })
    .join('&');
  return fetch(PROXY_URL + '?' + qs, { redirect: 'follow' })
    .then(function(r) { return r.json() });
}

// 쿼리 실행
var d = await xxApi({
  action: 'post',
  queryId: 1339,
  startDate: '2026-02-01',
  endDate: '2026-02-28'
});

// 즉시 결과 반환 시
if (d.query_result) {
  processRows(d.query_result.data.rows);
}

// Job으로 비동기 실행 시
if (d.job) {
  // 1초 간격 폴링 (최대 60회)
  var jobData = await xxApi({ action: 'job', jobId: d.job.id });
  if (jobData.job.status === 3) {
    var result = await xxApi({ action: 'result', resultId: jobData.job.query_result_id });
    processRows(result.query_result.data.rows);
  }
}
```

## GAS 배포/업데이트 절차
1. script.google.com 에서 프로젝트 열기
2. 코드 수정
3. 배포 > 배포 관리 > 수정(연필) > 버전: "새 버전" > 배포
4. 배포 ID는 동일하게 유지됨

## 현재 사용 중인 쿼리

| QID | 대시보드 | 파라미터 | 설명 |
|-----|---------|---------|------|
| 1339 | 복지대장 지급현황 | startDate, endDate | 로우 단위 (comId, name, userId, executeDate, amount) |

## 주의사항
- GAS doGet만 사용 (doPost는 CORS 리다이렉트 문제)
- 모든 파라미터를 쿼리스트링으로 전달
- `redirect: 'follow'` 필수 (GAS 응답이 302 리다이렉트)
- GAS 실행 시간 제한: 6분 (무료) / 30분 (Workspace)
- 대시보드에서 전년 비교 시 동일 쿼리를 -1년 날짜로 재호출 (GAS 수정 불필요)
- 새 Redash 쿼리에 파라미터가 추가되더라도 GAS 수정 불필요 (동적 전달)
