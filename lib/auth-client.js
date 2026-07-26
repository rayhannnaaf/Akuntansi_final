export async function signIn(email, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error || 'Login gagal' };
    }

    localStorage.setItem('token', json.token);
    localStorage.setItem('user', JSON.stringify(json.user));

    return { data: json, error: null };
  } catch (err) {
    return { data: null, error: 'Tidak bisa terhubung ke server' };
  }
}

// Ambil data user yang sedang login dari localStorage
export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Logout: hapus token & user dari localStorage
export function signOut() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Header Authorization siap pakai untuk fetch() ke API yang butuh login
export function authHeader() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}