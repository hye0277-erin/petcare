// ===== Supabase 인증(Auth) 유틸 =====
// 회원가입 / 로그인 / 로그아웃 / 세션가드를 제공합니다.
// 다른 페이지에서: import { signUp, signIn, signOut, requireAuth, getUser } from './auth.js';

import { supabase } from './config.js';

// ---- 회원가입 ----
// 성공 시 { ok:true }, 실패 시 { ok:false, message }
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: toKoreanError(error.message) };
  // 이메일 인증이 켜져 있으면 data.session 이 null 일 수 있음
  const needConfirm = !data.session;
  return { ok: true, needConfirm };
}

// ---- 로그인 ----
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: toKoreanError(error.message) };
  return { ok: true };
}

// ---- 로그아웃 ----
export async function signOut() {
  await supabase.auth.signOut();
  location.href = 'login.html';
}

// ---- 현재 로그인한 사용자 (없으면 null) ----
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

// ---- 세션가드 : 로그인 안 했으면 login.html 로 보냄 ----
// 보호할 페이지 최상단에서 await requireAuth() 로 호출.
export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    location.replace('login.html');
    return null;
  }
  return user;
}

// ---- Supabase 영문 에러 메시지를 사용자용 한글로 변환 ----
function toKoreanError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (m.includes('user already registered')) return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (m.includes('password should be at least')) return '비밀번호는 6자 이상이어야 해요.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return '이메일 형식이 올바르지 않아요.';
  if (m.includes('email not confirmed')) return '이메일 인증이 필요해요. 메일함을 확인해 주세요.';
  return msg || '오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
}
