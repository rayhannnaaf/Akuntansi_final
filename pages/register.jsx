import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', nama: '', role: 'guru' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.nama) {
      toast.error('Isi semua kolom yang wajib diisi');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal mendaftarkan pengguna');
      } else {
        toast.success(data.message || 'Pengguna berhasil didaftarkan');
        router.push('/dashboard/users');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid var(--border)',
    borderRadius: 10,
    fontSize: 13,
    outline: 'none',
    transition: 'border 0.15s',
    background: 'var(--surface)',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
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
            Daftarkan Pengguna
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Hanya admin yang dapat mendaftarkan akun baru
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Nama */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nama Lengkap</label>
            <input
              type="text"
              value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Budi Santoso"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="guru@sekolah.sch.id"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Minimal 6 karakter"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Role */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{
                ...inputStyle,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                paddingRight: 36,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              <option value="guru">Guru</option>
              <option value="admin">Admin</option>
            </select>
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
            {loading ? 'Mendaftarkan...' : 'Daftarkan Pengguna →'}
          </button>
        </form>

        <button
          onClick={() => router.back()}
          style={{
            display: 'block', width: '100%',
            marginTop: 12, padding: '10px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1.5px solid var(--border)',
            borderRadius: 10, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >
          ← Kembali
        </button>
      </div>
    </div>
  );
}