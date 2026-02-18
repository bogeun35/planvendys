# Vendys Internal Docs - Claude Code 프로젝트 설정

## 프로젝트 개요
GitHub Pages 기반 Vendys 사내 문서/위키 + 운영 대시보드 시스템.
Firebase Auth(@vendys.co.kr 도메인 제한), 순수 HTML/CSS/JS, Redash API → GAS 프록시.

## 핵심 레퍼런스 문서
작업 전 반드시 참조:
- `.claude-docs/PROJECT_PROMPT.md` — 프로젝트 전체 구조, 디자인 시스템, 코딩 규칙
- `.claude-docs/DASHBOARD_GUIDE.md` — 대시보드 개발 가이드 (HTML 구조, UI 패턴, 데이터 처리)
- `.claude-docs/GAS_PROXY.md` — GAS Redash 프록시 아키텍처, API 호출 규격

## 운영 문서 (docs/ops/*.md)
- `contract-extractor.md` — 수기 계약서 PDF 추출기
- `giftpresent.md` — 단체선물대장 주문현황
- `sds-report.md` — SDS 결제내역 보고서
- `settlement-transfer.md` — HIFI 전표입력 양식 규격
- `welfare-dashboard.md` — 복지대장 지급현황 대시보드

## 코딩 규칙 요약
- 프레임워크 없음 (순수 HTML/CSS/JS, var 사용)
- 대시보드 함수는 전역 선언 + 접두사 (wf, sk, gp 등)
- 상태는 전역 객체 하나에 모음 (var W = {...})
- API Key는 GitHub에 절대 포함하지 않음 (GAS에서 관리)
- 이모지 사용 금지, 다크모드 없음
- ERP 스타일: 여백 최소화, 촘촘한 패딩, 12-13px 폰트
- 컬러: 흰색 기반, 액센트 #4a90d9, 텍스트 #1a2332/#4a5568/#94a3b8

## 파일 수정 규칙
- index.html → 수정 불필요
- 문서 콘텐츠 → docs/ 폴더 HTML 파일만 수정
- 네비게이션 구조 → sitemap.json만 수정
