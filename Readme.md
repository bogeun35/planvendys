# Vendys Internal Docs - 관리 가이드

## 폴더 구조

```
planvendys/
├── index.html          ← 메인 앱 (수정 불필요)
├── sitemap.json        ← 페이지 트리 구조 (여기서 관리)
└── docs/               ← 문서 콘텐츠
    ├── services/
    │   ├── sikgwon/
    │   │   ├── index.html
    │   │   ├── admin.html
    │   │   ├── admin-report.html
    │   │   ├── app.html
    │   │   └── store.html
    │   ├── bokji/
    │   │   ├── index.html
    │   │   └── category.html
    │   ├── quick.html
    │   └── gift.html
    ├── dev/
    │   ├── api-guide.html
    │   ├── api-sikgwon.html
    │   ├── api-auth.html
    │   ├── db-schema.html
    │   └── dev-env.html
    └── ops/
        ├── guide.html
        ├── cs.html
        ├── deploy.html
        └── monitoring.html
```

## 새 문서 추가하는 법

### 1단계: HTML 파일 생성

`docs/` 폴더에 적절한 위치에 HTML 파일을 만듭니다.

```html
<!--
title: 페이지 제목
meta: 최종 수정: 2025.02.16
-->
<h2>제목</h2>
<p>내용을 여기에 작성합니다.</p>
```

- 상단 주석(`<!-- -->`)에 title과 meta를 넣으면 자동 파싱됩니다.
- `<html>`, `<head>`, `<body>` 태그는 불필요합니다. 본문 HTML만 작성하세요.
- 사용 가능한 스타일: `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<code>`, `<pre>`, `<table>`, `<div class="callout">`, `<div class="callout-warn">`

### 2단계: sitemap.json에 등록

```json
{
  "id": "new-page",
  "title": "새 페이지",
  "icon": "doc",
  "desc": "간단한 설명",
  "file": "docs/services/sikgwon/new-page.html"
}
```

- `id`: 고유값 (영문, 하이픈 사용)
- `icon`: `folder`, `doc`, `api`, `db` 중 선택
- `file`: docs/ 폴더 기준 경로
- `children`: 하위 페이지가 있으면 배열로 추가 (무한 중첩 가능)

### 3단계: git push

```bash
git add .
git commit -m "docs: 새 페이지 추가"
git push
```

## 새 탭(섹션) 추가

sitemap.json의 sections 배열에 추가합니다:

```json
{
  "tab": "새 탭 이름",
  "pages": [...]
}
```

## 문서만 수정할 때

docs/ 안의 HTML 파일만 수정하면 됩니다.
sitemap.json은 건드릴 필요 없습니다.

## 문서 삭제

1. sitemap.json에서 해당 항목 제거
2. docs/ 안의 HTML 파일 삭제
3. git push
