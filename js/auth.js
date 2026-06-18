const OFFLINE_MESSAGE = 'Backend connection is temporarily disabled.';

export async function signUp() {
  return { ok: false, message: OFFLINE_MESSAGE };
}

export async function signIn() {
  return { ok: false, message: OFFLINE_MESSAGE };
}

export async function signOut() {
  location.href = 'login.html';
}

export async function getUser() {
  return null;
}

export async function requireAuth() {
  location.replace('login.html');
  return null;
}
