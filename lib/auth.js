import { supabase, supabaseAdmin } from './supabase';

export async function getSessionUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.user;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Middleware helper untuk API routes
export async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token tidak ditemukan' });
    return null;
  }
  const token = authHeader.replace('Bearer ', '');

  const admin = supabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Sesi tidak valid' });
    return null;
  }
  return user;
}

export async function requireRole(req, res, allowedRoles = ['admin', 'guru']) {
  const user = await requireAuth(req, res);
  if (!user) return null;

  const admin = supabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !allowedRoles.includes(profile.role)) {
    res.status(403).json({
      error: 'Akses ditolak',
      debug: {
        userId: user.id,
        profile: profile,
        profileError: profileError ? profileError.message : null,
        allowedRoles: allowedRoles,
      },
    });
    return null;
  }
  return { user, profile };
}