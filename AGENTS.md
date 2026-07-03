# AGENTS.md

PetCare+ 프로젝트에서 AI 작업자가 따라야 할 공통 작업 규칙입니다. 모든 후속 작업은 이 문서와 `PROJECT.md`, `TASK.md`, `docs/design-system.md`, `docs/qa-checklist.md`를 기준으로 진행합니다.

# Project Operating Principles

PetCare+는 장기적으로 유지보수 가능한 프로젝트를 목표로 한다.
AI는 단순히 코드를 작성하는 역할이 아니라
프로젝트의 개발자이자 QA Lead로 행동한다.
항상 프로젝트 전체를 기준으로 판단한다.
현재 작업만 보지 않는다.
관련 파일도 함께 확인한다.
현재 기능에 영향을 줄 수 있는 변경 사항이 있는지 먼저 분석한다.

## 개발 규칙

- 기존 정적 HTML/CSS/vanilla JavaScript 구조를 유지한다.
- 기능별 파일 분리를 지킨다.
  - 화면: `*.html`
  - 스타일: `css/*.css`
  - 화면별 동작: `js/*.js`
  - 공통 저장소: `js/store.js`
- 현재 MVP의 기본 데이터 흐름은 localStorage와 `window.PetStore`이다.
- Supabase 관련 작업은 `SETUP.md`, `js/config.js`, `js/api.js`, `supabase/schema.sql`과 충돌하지 않게 한다.
- 새 기능은 반려동물 단위 데이터 분리를 전제로 설계한다.
- 건강 앱 특성상 진단, 질병 판단, 치료 권고처럼 보이는 문구는 사용하지 않는다.
- 삭제 기능은 가능하면 즉시 영구 삭제보다 보관함, 복구, 확인 절차를 우선 고려한다.
- 작업 범위 밖 대규모 리팩터링은 하지 않는다.
- 사용자가 만든 변경사항은 되돌리지 않는다.

## QA 규칙

- `docs/qa-checklist.md`의 공통 체크리스트를 따른다.
- HTML 태그 닫힘, 속성 따옴표, 스크립트 연결, CSS 연결을 확인한다.
- 저장, 수정, 삭제, 임시저장 기능은 localStorage 반영 여부를 확인한다.
- 모바일 폭에서 텍스트 겹침, 버튼 잘림, 하단 고정 영역 가림이 없는지 확인한다.
- 새 CSS가 기존 화면에 의도치 않은 영향을 주지 않도록 선택자를 좁게 작성한다.
- 자동화가 가능하면 Playwright 또는 브라우저 기반 확인을 우선한다.
- QA를 실행하지 못한 경우 이유를 완료 보고에 명시한다.

# Continuous QA

QA는 마지막 단계가 아니다.
모든 수정 후 반드시 수행한다.
다음 항목을 검사한다.
- Console Error
- JavaScript Error
- localStorage 동작
- Responsive
- Empty State
- Loading State
- Error State
- Component Reuse
- Design System
- Accessibility
- 기존 화면 영향
문제가 발견되면
안전한 범위에서는 즉시 수정한다.
큰 변경이 필요한 경우만 사용자에게 보고한다.

# Regression QA
파일을 수정한 경우
관련 화면도 함께 확인한다.
예를 들어
hospital.js 수정
↓
hospital.html
hospital.css
store.js
관련 report 화면
관련 navigation
까지 함께 확인한다.
한 파일만 검사하지 않는다.

# Auto Review
작업이 끝나면
스스로 코드 리뷰를 수행한다.
다음 항목을 확인한다.
- 중복 코드
- 사용하지 않는 함수
- 사용하지 않는 CSS
- import 누락
- 변수명
- 함수명
- 유지보수성
개선 가능한 부분은 제안한다.

## 디자인 시스템 유지

- `docs/design-system.md`를 우선 기준으로 한다.
- 공통 토큰과 앱 프레임은 `css/style.css`를 따른다.
- v2 화면 헤더, 탭바, 스크롤 규칙은 `css/page-v2.css`를 따른다.
- 병원 화면 전용 UI는 `css/hospital.css`의 `.hosp-*` 계열을 사용한다.
- 새 화면은 랜딩 페이지가 아니라 실제 사용 가능한 앱 화면으로 만든다.
- 카드, 입력창, 버튼, 하단 탭바, 시트는 기존 PetCare+ 시각 톤과 맞춘다.
- safe-area와 하단 고정 버튼이 콘텐츠를 가리지 않는지 확인한다.

## 코드 스타일

- JavaScript는 현재 코드베이스와 동일하게 IIFE, `"use strict"`, DOM 이벤트 위임 패턴을 우선 사용한다.
- DOM 문자열에 저장 데이터나 사용자 입력을 넣을 때는 escape 처리한다.
- 함수 이름은 기능을 설명하는 명확한 이름을 사용한다.
- CSS 선택자는 화면 전용 prefix를 사용한다.
  - 예: `.hosp-*`, `.pv2-*`, `.report-*`, `.noti-*`
- 주석은 복잡한 의도나 데이터 흐름 설명이 필요한 곳에만 짧게 작성한다.
- 새 외부 프레임워크는 추가하지 않는다.
- 기존 인코딩 문제가 있는 파일은 필요한 범위만 수정하고 대규모 재저장은 피한다.

## 작업 방식

1. 작업 시작 전 `AGENTS.md`, `PROJECT.md`, `TASK.md`, `docs/design-system.md`, `docs/qa-checklist.md`를 읽는다.
2. `TASK.md`의 오늘 작업과 완료 조건을 우선 확인한다.
3. 관련 HTML, CSS, JS, store 흐름을 읽고 변경 범위를 정한다.
4. 변경은 작게 수행하고, 이유가 분명한 파일만 수정한다.
5. 발견한 별도 문제는 임의로 크게 고치지 않고 `남은 작업`에 기록한다.
6. 완료 후 다음 형식으로 보고한다.
   - 완료한 작업
   - 수정한 파일
   - QA 결과
   - 남은 작업
   - 다음 작업


# Think Before Coding
코드를 작성하기 전에 반드시 아래 순서를 따른다.
1. 요구사항 분석
2. 관련 파일 분석
3. 영향 범위 분석
4. 구현 계획
5. 구현
6. QA
7. PROJECT.md 업데이트

바로 코드를 작성하지 않는다.


# Release Goal
프로젝트 목표는
MVP Release이다.
다음 조건을 만족해야 한다.
Build Success
Console Error 0
Critical Bug 0
Responsive OK
QA Complete
Design Consistency
LocalStorage 정상 동작
출시 가능한 수준의 품질

