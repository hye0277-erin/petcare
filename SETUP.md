# Pet Care+ 백엔드 연결 가이드 (Supabase)

이 앱을 Supabase(Auth + Database + Storage)에 연결하는 방법입니다.
**직접 하셔야 하는 부분(1, 4단계)** 과 코드는 이미 작성되어 있습니다.

---

## 1단계. Supabase 프로젝트 만들기 (직접)

1. https://supabase.com 접속 → **Start your project** → 깃허브/구글 계정으로 가입
2. **New project** 클릭
   - Name: `petcare` (아무거나)
   - Database Password: 안전한 비밀번호 입력 후 **꼭 따로 메모** (DB 직접 접속 시 필요)
   - Region: `Northeast Asia (Seoul)` 추천
3. 프로젝트 생성까지 1~2분 기다립니다.
4. 왼쪽 메뉴 **Project Settings(톱니바퀴) → API** 로 이동해서 아래 2개를 복사:
   - **Project URL** (예: `https://abcdxyz.supabase.co`)
   - **Project API keys → `anon` `public`** 키 (긴 문자열)

> ⚠️ `anon` 키는 브라우저에 노출돼도 되는 공개 키입니다. (`service_role` 키는 절대 프론트에 쓰지 마세요.)

---

## 2단계. 데이터베이스 테이블 만들기

1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 폴더의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 **전체 복사 → 붙여넣기 → Run** (Ctrl+Enter)
3. "Success" 가 뜨면 테이블(`pets`, `tasks`, `records`)과 보안정책(RLS)이 만들어진 것입니다.

확인: 왼쪽 **Table Editor** 에 `pets`, `tasks`, `records` 가 보이면 성공.

---

## 3단계. Storage 버킷 만들기 (반려동물 사진용)

1. 왼쪽 메뉴 **Storage** → **New bucket**
2. Name: `pet-photos`
3. **Public bucket** 토글을 **켭니다(ON)** → Save
   - (사진을 앱에서 바로 `<img>` 로 보여주기 위해 공개로 둡니다.)

---

## 4단계. 앱에 키 입력하기 (직접)

[`js/config.js`](js/config.js) 파일을 열고 1단계에서 복사한 값을 붙여넣습니다:

```js
const SUPABASE_URL = '여기에 Project URL';
const SUPABASE_ANON_KEY = '여기에 anon public 키';
```

---

## 5단계. 실행하기

이 앱은 정적 파일이라 그냥 더블클릭으로 열면 일부 기능(모듈 import)이 막힐 수 있어요.
**로컬 서버로 여는 걸 권장**합니다. VS Code라면:

- 확장프로그램 **Live Server** 설치 → `login.html` 우클릭 → **Open with Live Server**

또는 터미널에서 (Node가 있다면):

```powershell
npx serve .
```

브라우저에서 `login.html` 로 접속 → 회원가입 → 로그인하면 데이터가 Supabase에 저장됩니다.

---

## 동작 방식 요약

- 로그인하면 그 사용자(`user_id`)의 데이터만 보입니다. (RLS가 막아줌)
- `pet`, `tasks`, `records` 가 브라우저(localStorage)가 아니라 **Supabase DB**에 저장됩니다.
- 다른 기기/브라우저에서 같은 계정으로 로그인하면 **같은 데이터**가 보입니다.
- 반려동물 사진은 Storage 버킷 `pet-photos` 에 업로드됩니다.
