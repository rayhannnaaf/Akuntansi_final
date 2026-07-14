import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from '../lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Isi email dan password');
      return;
    }
    setLoading(true);
    const { data, error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) {
      toast.error('Email atau password salah');
    } else {
      toast.success('Selamat datang!');
      router.push('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Decorative bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(232,160,32,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        padding: '40px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 900, color: 'var(--accent)',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(15,76,92,0.3)',
          }}>A</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>
            AkuntansiSMA
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Sistem Pencatatan Akuntansi Sekolah
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="admin@sekolah.sch.id"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: 10, fontSize: 13,
                outline: 'none', transition: 'border 0.15s',
                background: 'var(--surface)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid var(--border)',
                borderRadius: 10, fontSize: 13,
                outline: 'none', transition: 'border 0.15s',
                background: 'var(--surface)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--text-muted)' : 'var(--primary)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: '0 4px 12px rgba(15,76,92,0.3)',
            }}
          >
            {loading ? 'Masuk...' : 'Masuk →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          Hubungi administrator untuk mendaftar akun baru
        </p>
      </div>
    </div>
  );
}
