/* ============================================================
   PetCare+ · 로그인 가드 (ES module)
   - 보호할 화면 <head> 또는 본문에 아래 한 줄을 추가하면 됩니다.
       <script type="module" src="js/guard.js"></script>
   - 미로그인 사용자는 login.html 로 이동합니다.
   - Supabase 미설정/네트워크 오류 등으로 확인 실패 시에는
     데모가 막히지 않도록 통과시킵니다(인증만 사용하는 MVP 방침).
   ============================================================ */
import { getUser } from './auth.js';

try {
  const user = await getUser();
  // 라이브 데모: 로그인 없이 모든 화면 접근 허용
  // if (!user) location.replace('login.html');
} catch (_) {
  // 인증 서버 확인 실패 시 데모 흐름은 막지 않음
}
