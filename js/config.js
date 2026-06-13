// ===== Supabase 설정 =====
// SETUP.md 1단계에서 복사한 값을 아래 두 줄에 붙여넣으세요.
//  - SUPABASE_URL     : Project Settings → API → Project URL
//  - SUPABASE_ANON_KEY: Project Settings → API → anon public 키
// ※ anon 키는 브라우저에 노출돼도 되는 공개 키입니다. (service_role 키는 절대 사용 금지)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://gjcqyakgvpwqktpzqfhn.supabase.co';        // 예: https://abcdxyz.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_GgSH65OZJDbXzyiowis-Ng_wayUcKb2';

// 다른 JS 파일에서 import 해서 공유하는 클라이언트
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 키 입력 여부 간단 확인 (콘솔 경고)
if (SUPABASE_URL.startsWith('YOUR_') || SUPABASE_ANON_KEY.startsWith('YOUR_')) {
  console.warn('[config.js] Supabase URL/anon key가 아직 입력되지 않았어요. js/config.js를 확인하세요.');
}
