const OFFLINE_MESSAGE = 'Backend connection is temporarily disabled.';

export async function signUp() {
  return { ok: false, message: OFFLINE_MESSAGE };
}

export async function signIn() {
  return { ok: false, message: OFFLINE_MESSAGE };
}

export async function signOut() {
  location.href = 'index.html';
}

export async function getUser() {
  return { id: 'demo', email: 'demo@petcare.app' };
}

export async function requireAuth() {
  return { id: 'demo', email: 'demo@petcare.app' };
}
