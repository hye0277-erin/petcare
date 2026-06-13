/* ============================================================
   PetCare+ · 비밀번호 찾기 로직 (ES module — Supabase auth)
   ============================================================ */
import { supabase } from './config.js';

const $ = (id) => document.getElementById(id);
$('fg-submit').addEventListener('click', async () => {
  const email = $('fg-email').value.trim();
  $('fg-error').style.display = 'none'; $('fg-info').style.display = 'none';
  if (!email) { $('fg-error').textContent = '이메일을 입력해 주세요.'; $('fg-error').style.display = 'block'; return; }
  $('fg-submit').disabled = true; $('fg-submit').textContent = '처리 중...';
  try {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login.html' });
  } catch (e) {}
  $('fg-info').textContent = '입력하신 이메일로 재설정 링크를 보냈어요. 메일함을 확인해 주세요.';
  $('fg-info').style.display = 'block';
  $('fg-submit').disabled = false; $('fg-submit').textContent = '재설정 링크 보내기';
});
