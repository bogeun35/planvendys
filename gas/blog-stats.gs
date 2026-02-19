/**
 * 블로그 통계 GAS 핸들러
 * 스프레드시트 ID: 13LWJmvtSJRy6G43Lo_jar9hqZquCY4vB4bP4kAQVQLQ
 *
 * Sheet A (첫 번째 시트): 게시글 메타데이터
 *   url, postId, thumbnail, image, title, content, publishDate, service, category,
 *   totalVisit, totalShow, weeklyVisitor, monthlyVisitor
 *
 * Sheet B (두 번째 시트): 일별 통계
 *   date, POST_ID, visitors, impressions, search_in, ...
 *
 * 사용 컬럼:
 *   Sheet A -> url, postId, thumbnail, title, content, publishDate, category, totalVisit
 *   Sheet B -> postId(POST_ID), date, visitors
 */

function handleBlogStats(e) {
  try {
    var ss = SpreadsheetApp.openById('13LWJmvtSJRy6G43Lo_jar9hqZquCY4vB4bP4kAQVQLQ');
    var sheets = ss.getSheets();

    // ── Sheet A: 게시글 메타데이터 ──
    var sheetA = sheets[0];
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
        publishDate: formatDate_(row[colA['publishDate']]),
        category: String(row[colA['category']] || ''),
        totalVisit: Number(row[colA['totalVisit']]) || 0
      });
    }

    // ── Sheet B: 일별 통계 ──
    var sheetB = sheets[1];
    var dataB = sheetB.getDataRange().getValues();
    var headersB = dataB[0];

    var colB = {};
    headersB.forEach(function(h, i) { colB[String(h).trim()] = i; });

    var daily = [];
    for (var j = 1; j < dataB.length; j++) {
      var rowB = dataB[j];
      var dpid = String(rowB[colB['POST_ID']] || '');
      if (!dpid) continue;
      daily.push({
        postId: dpid,
        date: formatDate_(rowB[colB['date']]),
        visitors: Number(rowB[colB['visitors']]) || 0
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
