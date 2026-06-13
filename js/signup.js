/* ============================================================
   PetCare+ · 회원가입 로직 (ES module — Supabase auth)
   ============================================================ */
import { signUp } from './auth.js';

const $ = (id) => document.getElementById(id);

// 약관 토글
function syncAll() {
  const items = [...document.querySelectorAll('[data-term]')];
  const allOn = items.every((c) => c.classList.contains('on'));
  $('chk-all').classList.toggle('on', allOn);
}
document.querySelectorAll('.term-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    item.querySelector('[data-term]').classList.toggle('on');
    syncAll();
  });
});
$('term-all').addEventListener('click', () => {
  const allOn = $('chk-all').classList.contains('on');
  $('chk-all').classList.toggle('on', !allOn);
  document.querySelectorAll('[data-term]').forEach((c) => c.classList.toggle('on', !allOn));
});

function showError(m) { $('su-error').textContent = m; $('su-error').style.display = 'block'; $('su-info').style.display = 'none'; }
function showInfo(m) { $('su-info').textContent = m; $('su-info').style.display = 'block'; $('su-error').style.display = 'none'; }

$('su-submit').addEventListener('click', async () => {
  const name = $('su-name').value.trim();
  const email = $('su-email').value.trim();
  const pw = $('su-pw').value;
  const pw2 = $('su-pw2').value;
  if (!name) return showError('이름을 입력해 주세요.');
  if (!email || !pw) return showError('이메일과 비밀번호를 입력해 주세요.');
  if (pw.length < 6) return showError('비밀번호는 6자 이상이어야 해요.');
  if (pw !== pw2) return showError('비밀번호가 일치하지 않아요.');
  const requiredOk = [...document.querySelectorAll('[data-term][data-required="1"]')].every((c) => c.classList.contains('on'));
  if (!requiredOk) return showError('필수 약관에 동의해 주세요.');

  $('su-submit').disabled = true; $('su-submit').textContent = '처리 중...';
  const res = await signUp(email, pw);
  if (res.ok && res.needConfirm) {
    showInfo('가입 확인 메일을 보냈어요. 메일 인증 후 로그인해 주세요.');
    $('su-submit').disabled = false; $('su-submit').textContent = '가입하기';
  } else if (res.ok) {
    // 인증 완료 후 첫 로그인 → 반려견 등록
    location.replace('register.html');
  } else {
    showError(res.message);
    $('su-submit').disabled = false; $('su-submit').textContent = '가입하기';
  }
});
