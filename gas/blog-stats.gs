/**
 * 블로그 통계 GAS 핸들러
 * 스프레드시트 ID: 13LWJmvtSJRy6G43Lo_jar9hqZquCY4vB4bP4kAQVQLQ
 *
 * Sheet A (gid=1134875956): 게시글 메타데이터
 *   url, postId, thumbnail, (image), title, content, date, service, category
 *
 * Sheet B (gid=1597305382): STATS_DAILY 일별 통계
 *   A:date, B:POST_ID, C:visitors, D:impressions, E:search_in, F:etc
 *   헤더에 "A:", "B:" 접두사 포함, POST_ID는 숫자형
 *
 * 사용 컬럼:
 *   Sheet A -> url, postId, thumbnail, title, content, date(작성일), category
 *   Sheet B -> B:POST_ID, A:date, C:visitors
 */

var BLOG_SHEET_ID = '13LWJmvtSJRy6G43Lo_jar9hqZquCY4vB4bP4kAQVQLQ';
var BLOG_GID_A = 1134875956;  // 게시글 메타데이터
var BLOG_GID_B = 1597305382;  // 일별 통계

function getSheetByGid_(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  return null;
}

function handleBlogStats(e) {
  try {
    var ss = SpreadsheetApp.openById(BLOG_SHEET_ID);

    // ── Sheet A (gid=1134875956): 게시글 메타데이터 ──
    var sheetA = getSheetByGid_(ss, BLOG_GID_A);
    if (!sheetA) throw new Error('Sheet A (gid=' + BLOG_GID_A + ') not found');

    var dataA = sheetA.getDataRange().getValues();
    var headersA = dataA[0];

    var colA = {};
    headersA.forEach(function(h, i) { colA[String(h).trim()] = i; });

    var posts = [];
    for (var i = 1; i < dataA.length; i++) {
      var row = dataA[i];
      var pid = String(row[colA['postId']] || '');
      if (!pid) continue;
      posts.push({
        url: String(row[colA['url']] || ''),
        postId: pid,
        thumbnail: String(row[colA['thumbnail']] || ''),
        title: String(row[colA['title']] || ''),
        content: String(row[colA['content']] || ''),
        publishDate: formatDate_(row[colA['date']] || row[colA['publishDate']]),
        category: String(row[colA['category']] || ''),
        totalVisit: Number(row[colA['totalVisit']]) || 0
      });
    }

    // ── Sheet B (gid=1597305382): 일별 통계 ──
    var sheetB = getSheetByGid_(ss, BLOG_GID_B);
    if (!sheetB) throw new Error('Sheet B (gid=' + BLOG_GID_B + ') not found');

    var dataB = sheetB.getDataRange().getValues();
    var headersB = dataB[0];

    // 헤더가 비어있으면 2행을 헤더로 사용
    var hasEmptyHeaders = headersB.every(function(h) { return !String(h).trim(); });
    if (hasEmptyHeaders && dataB.length > 1) {
      headersB = dataB[1];
    }

    // 헤더에 "A:", "B:" 등 접두사가 있으므로 제거하여 매핑
    var colB = {};
    headersB.forEach(function(h, i) {
      var key = String(h).trim().replace(/^[A-Z]:/, '');
      colB[key] = i;
    });

    // POST_ID 또는 postId 컬럼 찾기
    var postIdColB = colB['POST_ID'] !== undefined ? colB['POST_ID']
                   : colB['postId'] !== undefined ? colB['postId']
                   : colB['post_id'] !== undefined ? colB['post_id'] : -1;
    var dateColB = colB['date'] !== undefined ? colB['date'] : 0;
    var visitorsColB = colB['visitors'] !== undefined ? colB['visitors'] : 2;

    var startRow = hasEmptyHeaders ? 2 : 1;
    var daily = [];
    for (var j = startRow; j < dataB.length; j++) {
      var rowB = dataB[j];
      // POST_ID가 숫자형이므로 String()으로 변환
      var dpid = postIdColB >= 0 ? String(rowB[postIdColB] || '') : '';
      if (!dpid) continue;
      daily.push({
        postId: dpid,
        date: formatDate_(rowB[dateColB]),
        visitors: Number(rowB[visitorsColB]) || 0
      });
    }

    var result = JSON.stringify({ posts: posts, daily: daily });
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errResult = JSON.stringify({ error: err.message });
    return ContentService.createTextOutput(errResult).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 날짜 값을 YYYY-MM-DD 문자열로 변환
 * Date 객체, 문자열 모두 처리
 */
function formatDate_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ('0' + (val.getMonth() + 1)).slice(-2);
    var d = ('0' + val.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  return String(val);
}


// ──────────────────────────────────────────────
// doGet 라우팅 추가 안내
// ──────────────────────────────────────────────
// 기존 doGet 함수에 아래 한 줄을 추가하세요:
//
//   if (action === 'blogStats') return handleBlogStats(e);
//
// 예시:
//   function doGet(e) {
//     var action = e.parameter.action || 'get';
//     if (action === 'naverPlace') return handleNaverPlace(e);
//     if (action === 'daypoint') return handleDaypoint(e);
//     if (action === 'blogStats') return handleBlogStats(e);  // <-- 추가
//     // ... 기존 Redash 프록시 코드
//   }
// ──────────────────────────────────────────────
