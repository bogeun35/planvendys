# Vendys Internal Docs - 프로젝트 프롬프트

## 프로젝트 개요
GitHub Pages로 운영하는 Vendys 사내 전용 문서/위키 시스템이다.
Firebase Authentication(Google 로그인)으로 @vendys.co.kr 이메일 도메인만 접근 가능하도록 제한한다.

## 기술 스택
- 호스팅: GitHub Pages (https://bogeun35.github.io/planvendys/)
- 인증: Firebase Auth (Google OAuth) - 프로젝트 vendys-b1fea
- 프론트엔드: 순수 HTML/CSS/JS (프레임워크 없음, 단일 index.html)
- 문서 관리: 개별 HTML 파일 + sitemap.json으로 트리 구조 관리
- 대시보드 데이터: Redash API (redash.sikdae.com) → GAS 프록시 경유

## 인증 정책
- Firebase Auth Google 로그인 사용
- 로그인 후 이메일 도메인이 @vendys.co.kr인지 클라이언트에서 검증
- 도메인 불일치 시 즉시 signOut 처리 + 에러 메시지 표시
- Firebase 프로젝트는 개인 Gmail 계정으로 운영 (프로젝트 관리용)
- 승인된 도메인: bogeun35.github.io

## 파일 구조
```
planvendys/
├── index.html          ← 메인 앱 (레이아웃 + 인증 + 라우팅)
├── sitemap.json        ← 페이지 트리 구조 정의
└── docs/               ← 문서 콘텐츠 (개별 HTML 파일)
    ├── services/       ← 서비스 문서
    │   ├── sikgwon/    ← 식권대장
    │   ├── bokji/      ← 복지대장
    │   └── ...
    ├── dev/            ← 개발 문서
    └── ops/            ← 운영 문서/대시보드
        └── welfare-dashboard.html  ← 복지대장 지급현황 대시보드
```

## 페이지 구조

### GNB (Global Navigation Bar - 상단 고정)
- 좌측: 브랜드명 "Vendys Docs" + 탭 전환 (서비스 / 개발 / 운영 등)
- 우측: 전체 검색 (/ 단축키) + 사용자 프로필 + 로그아웃
- 탭은 sitemap.json의 sections 배열에서 자동 생성

### LNB (Local Navigation Bar - 좌측 사이드바)
- 현재 선택된 탭의 문서 트리를 표시
- 폴더 접기/펼치기 지원
- 무한 depth 중첩 가능 (children 배열)
- 현재 페이지 하이라이트

### Content (우측 메인 영역)
- 브레드크럼 경로 표시 (클릭으로 상위 이동)
- 문서 제목 + 메타정보 + 본문
- 하위 페이지가 있으면 카드 그리드로 표시
- 개별 HTML 파일을 fetch로 로드 (캐싱)
- 대시보드 HTML의 `<script>`는 index.html의 `executeScripts()`가 실행

### 검색
- GNB 검색창에서 전체 문서 제목/설명/본문 검색
- 검색 결과 클릭 시 해당 탭 전환 + 페이지 이동
- / 키로 검색 포커스, Esc로 닫기

## 문서 파일 작성 규칙
- 개별 HTML 파일은 본문 콘텐츠만 작성 (html/head/body 태그 불필요)
- 상단 주석으로 메타 정보 기입:
  ```html
  <!--
  title: 페이지 제목
  meta: 최종 수정: 2025.02.16
  -->
  ```
- 사용 가능한 HTML 요소: h2, h3, p, ul, ol, li, code, pre, table, div.callout, div.callout-warn
- 대시보드는 `<style>` + `<div>` + `<script>` 구조 (DASHBOARD_GUIDE.md 참조)

## sitemap.json 구조
```json
{
  "sections": [
    {
      "tab": "탭 이름",
      "pages": [
        {
          "id": "고유ID",
          "title": "표시 제목",
          "icon": "folder | doc | api | db",
          "desc": "짧은 설명",
          "file": "docs/경로/파일.html",
          "children": [...]
        }
      ]
    }
  ]
}
```

## 새 문서 추가 절차
1. docs/ 폴더에 HTML 파일 생성
2. sitemap.json에 해당 항목 추가
3. git push

## 디자인 시스템

### 컬러
- 배경: 흰색(#ffffff) 기반, 서브 배경 #f8fafd, #f0f4f9
- 액센트: 파스텔 파란색 (#4a90d9), 액센트 배경 #eef4fb
- 텍스트: #1a2332(주), #4a5568(부), #94a3b8(보조)
- 경고: #d49a2a, 위험: #e85d5d
- 성공/증가: #22c55e, 하락: #e85d5d
- 다크모드 사용하지 않음

### 타이포그래피
- 본문: Noto Sans KR
- 코드/숫자: JetBrains Mono
- 기본 폰트 크기: 12-13px

### 레이아웃 원칙
- 여백 최소화 (ERP 스타일, 빽빽하게)
- 스크롤 최소화 - 스크롤이 길어질 경우 2단 분리 (리스트/옵션 + 기능)
- GNB 높이: 40px, LNB 너비: 230px
- 콘텐츠 영역 패딩: 16px 24px
- 이모지 사용하지 않음
- 모던하고 깔끔한 톤

### UI 컴포넌트 스타일
- border-radius: 3-4px (작게)
- 테이블 셀 패딩: 5px 10px (4px 8px for compact)
- 트리 항목 패딩: 3px 6px
- callout 패딩: 8px 12px
- 줄간격: 1.5-1.6 (촘촘하게)

### 데이터 표시 규칙
- 테이블 데이터: 숫자만 표시 (단위 없음), 헤더에 단위 명시 → `지급액(원)`, `사용자(명)`
- 서머리 카드: 축약 표시 + 단위 포함 → `42.5억`, `13,125명`
- 증감 표시: 양수 #22c55e, 음수 #e85d5d, +-부호 포함
- 신규 진입: `NEW`, 이탈: `OUT`
- 클립보드 복사: 헤더 포함, 탭 구분, 숫자만 (엑셀 호환)

## 코드 작성 시 주의사항
- index.html은 한 번 올리면 수정 불필요하도록 설계
- 문서 콘텐츠 변경은 docs/ 파일만 수정
- 구조 변경은 sitemap.json만 수정
- 페이지 로드 시 fetch + 캐싱으로 성능 최적화
- Firebase config는 코드에 하드코딩 (클라이언트 전용이므로 보안 이슈 없음)
- 대시보드 함수는 전역 선언 + 접두사로 충돌 방지 (wf, sk 등)
