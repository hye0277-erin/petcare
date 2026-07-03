# PROJECT.md

PetCare+ 프로젝트의 현재 상태와 목표를 정리한 기준 문서입니다.

## 프로젝트 개요

PetCare+는 반려동물의 건강 기록, 반복 케어 일정, 병원 방문 기록, 검사 자료, 리포트, 알림을 모바일 중심으로 관리하는 웹앱입니다.

현재 프로젝트는 정적 HTML/CSS/vanilla JavaScript 기반 MVP입니다. 주요 데이터는 `js/store.js`의 `PetStore`를 통해 localStorage에 저장됩니다. Supabase 연동을 위한 설정 파일과 스키마가 있지만, 실제 앱 대부분은 아직 localStorage 흐름이 중심입니다.

## 현재 기술 구조

- 화면: 루트의 개별 HTML 파일
- 스타일: `css/`
- 동작: `js/`
- 공통 저장소: `js/store.js`
- 인증/원격 데이터 준비: `js/auth.js`, `js/api.js`, `js/config.js`, `supabase/schema.sql`
- QA 도구: Playwright dev dependency
- 실행 방식: 정적 파일 또는 로컬 서버

## 현재 진행률

대략적인 MVP 진행률: 65%

- 화면 뼈대와 주요 네비게이션: 80%
- 기록 및 일정 localStorage 흐름: 70%
- 병원 기록 흐름: 70%
- 디자인 시스템 일관성: 60%
- 리포트/알림 고도화: 45%
- Supabase 실연동: 25%
- QA 자동화와 문서화: 40%

## 구현 완료 목록

- 기본 앱 화면
  - `index.html`
  - `record.html`
  - `schedule.html`
  - `schedule-add.html`
  - `routines.html`
  - `hospital.html`
  - `hospital-add.html`
  - `hospital-detail.html`
  - `report.html`
  - `notifications.html`
  - `settings.html`
- 인증/온보딩 관련 화면
  - `login.html`
  - `signup.html`
  - `register.html`
  - `forgot.html`
  - `onboarding.html`
  - `landing.html`
- 공통 스타일 시스템
  - `css/style.css`
  - `css/page-v2.css`
  - `css/picker.css`
- 병원 기록 관련 파일
  - `css/hospital.css`
  - `js/hospital.js`
  - `js/hospital-add.js`
  - `js/hospital-detail.js`
- 기록, 일정, 루틴, 리포트, 알림, 설정 스크립트
  - `js/store.js`
  - `js/record.js`
  - `js/schedule.js`
  - `js/routines.js`
  - `js/report.js`
  - `js/notifications.js`
  - `js/main.js`
- Supabase 준비 파일
  - `SETUP.md`
  - `supabase/schema.sql`

## 현재 발견된 상태

- 프로젝트 루트에는 다수의 HTML 화면이 이미 존재한다.
- `docs/` 폴더는 존재하지만 디자인 시스템과 QA 기준 문서는 비어 있어 이번 작업에서 생성했다.
- `package.json`에는 Playwright만 dev dependency로 등록되어 있다.
- 일부 HTML/JS/CSS 파일에 한글 mojibake 문구가 남아 있다.
- `hospital-add.html`, `hospital-detail.html`, `css/hospital.css`, 병원 관련 JS는 git 기준 untracked 상태로 보인다.
- 최근 `hospital-add.html` 화면 폭 이슈는 `css/hospital.css`의 폼 섹션 여백 조정으로 개선된 상태다.

## 남은 작업

- 한글 깨짐 문구 정리
- 빠른 기록 화면 추가 및 보완
  - 물 기록
  - 배변 기록
  - 산책 기록
  - 수면 기록
  - 메모 기록
- 기록 저장 후 오늘 타임라인, 일정, 리포트에 즉시 반영되는 흐름 정교화
- 병원 기록과 처방 루틴 연결 강화
- 검사 자료 파일 관리 고도화
  - 미리보기
  - 다운로드
  - 교체
  - 삭제
  - 공유
- 공유 방식 선택 화면 추가
- 보관함 및 삭제 복구 흐름 추가
- Supabase Auth, Database, Storage 실연동 검증
- Playwright 기반 기본 회귀 테스트 추가
- 모바일 실제 뷰포트 QA

## 프로젝트 목표

1. 보호자가 반려동물의 케어 일정을 매일 쉽게 확인하고 완료 처리할 수 있게 한다.
2. 건강 기록과 병원 기록을 빠르게 남기고 나중에 쉽게 찾아볼 수 있게 한다.
3. 검사 자료와 처방 정보를 병원 방문 기록에 연결한다.
4. 리포트와 알림을 통해 반복 관리가 필요한 항목을 놓치지 않게 한다.
5. MVP 단계에서는 과도한 분석보다 기록, 저장, 조회, 수정, 공유 흐름의 완성도를 우선한다.
6. 의료 진단처럼 보이는 표현을 피하고, 보호자 기록 정리 도구로서 신뢰감을 유지한다.

