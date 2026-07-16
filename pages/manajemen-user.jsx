import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout'
import toast from 'react-hot-toast';

// ── Create User Modal ────────────────────────────────────────────────────
function CreateUserModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'siswa' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.nama.trim())    e.nama     = 'Nama wajib diisi';
    if (!form.email.trim())   e.email    = 'Email wajib diisi';
    if (!form.password)       e.password = 'Password wajib diisi';
    else if (form.password.length < 6) e.password = 'Minimal 6 karakter';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      // Ambil token dari session aktif untuk dikirim ke API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesi habis, silakan login ulang');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Gagal membuat pengguna');
      } else {
        toast.success(`Pengguna "${form.nama}" berhasil ditambahkan`);
        onSuccess();
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: 'var(--text-secondary)', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => {
          setForm(f => ({ ...f, [key]: e.target.value }));
          if (errors[key]) setErrors(er => ({ ...er, [key]: null }));
        }}
        style={{
          width: '100%', padding: '10px 13px',
          border: `1.5px solid ${errors[key] ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 9, fontSize: 13,
          background: 'var(--surface)',
          outline: 'none', transition: 'border 0.15s',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = errors[key] ? 'var(--danger)' : 'var(--primary)'}
        onBlur={e => e.target.style.borderColor = errors[key] ? 'var(--danger)' : 'var(--border)'}
      />
      {errors[key] && (
        <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--surface-raised)',
          borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>👤</div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              Tambah Pengguna
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Akun baru akan langsung aktif
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', width: 28, height: 28,
              borderRadius: 6, border: 'none',
              background: 'var(--surface-inset)',
              color: 'var(--text-muted)',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Modal body */}
        <div style={{ padding: '22px 24px' }}>
          {field('nama', 'Nama Lengkap', 'text', 'Budi Santoso')}
          {field('email', 'Email', 'email', 'siswa@sekolah.sch.id')}
          {field('password', 'Password', 'password', 'Minimal 6 karakter')}

          {/* Role selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 700,
              color: 'var(--text-secondary)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: 0.6,
            }}>
              Role
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['siswa', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  style={{
                    flex: 1, padding: '9px 0',
                    borderRadius: 9, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: '1.5px solid',
                    borderColor: form.role === r ? 'var(--primary)' : 'var(--border)',
                    background: form.role === r
                      ? (r === 'admin' ? 'rgba(232,160,32,0.12)' : 'rgba(15,76,92,0.08)')
                      : 'var(--surface)',
                    color: form.role === r
                      ? (r === 'admin' ? 'var(--accent-dark)' : 'var(--primary)')
                      : 'var(--text-secondary)',
                  }}
                >
                  {r === 'siswa' ? '📚 siswa' : '🔑 Admin'}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {form.role === 'admin'
                ? 'Admin dapat mengelola pengguna dan semua data sistem.'
                : 'siswa dapat mencatat transaksi dan melihat laporan.'}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 9,
                background: 'var(--surface-inset)',
                border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                flex: 2, padding: '10px 0', borderRadius: 9,
                background: loading ? 'var(--text-muted)' : 'var(--primary)',
                border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(15,76,92,0.3)',
              }}
            >
              {loading ? 'Menyimpan...' : 'Tambah Pengguna →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Role Badge ───────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.5,
      background: isAdmin ? 'rgba(232,160,32,0.15)' : 'rgba(15,76,92,0.08)',
      color: isAdmin ? 'var(--accent-dark)' : 'var(--primary)',
      border: `1px solid ${isAdmin ? 'rgba(232,160,32,0.4)' : 'rgba(15,76,92,0.2)'}`,
    }}>
      {isAdmin ? '🔑' : '📚'} {role}
    </span>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────
export default function ManajemenUserPage() {
  const router = useRouter();
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch]       = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Guard: hanya admin yang boleh masuk
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.role !== 'admin') {
            toast.error('Akses ditolak. Hanya admin yang dapat masuk ke halaman ini.');
            router.replace('/dashboard');
            return;
          }
          setCurrentUser(data);
          fetchUsers();
        });
    });
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Gagal memuat daftar pengguna');
    else setUsers(data || []);
    setLoading(false);
  };

  const filtered = users.filter(u =>
    u.nama?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const siswaCount  = users.filter(u => u.role === 'siswa').length;

  return (
    <Layout title="Manajemen User">
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchUsers(); }}
        />
      )}

      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16,
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            Manajemen Pengguna
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Kelola akun siswa dan admin sistem
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px',
            background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(15,76,92,0.3)',
            transition: 'opacity 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ fontSize: 16 }}>+</span> Tambah Pengguna
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Pengguna', value: users.length, icon: '👥', color: 'var(--primary)' },
          { label: 'siswa', value: siswaCount,  icon: '📚', color: '#2980b9' },
          { label: 'Admin', value: adminCount, icon: '🔑', color: 'var(--accent-dark)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 120px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 320 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          style={{
            width: '100%', padding: '9px 13px 9px 36px',
            border: '1.5px solid var(--border)',
            borderRadius: 9, fontSize: 13,
            background: 'var(--surface-raised)',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2.5fr 1fr 1fr',
          padding: '10px 20px',
          background: 'var(--surface-inset)',
          borderBottom: '1px solid var(--border)',
          fontSize: 11, fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}>
          <span>Nama</span>
          <span>Email</span>
          <span>Role</span>
          <span>Bergabung</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Memuat data...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              {search ? 'Tidak ada pengguna yang cocok.' : 'Belum ada pengguna terdaftar.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  marginTop: 12, padding: '8px 16px',
                  background: 'var(--primary)', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                + Tambah Pengguna Pertama
              </button>
            )}
          </div>
        ) : (
          filtered.map((user, i) => {
            const isSelf = user.id === currentUser?.id;
            return (
              <div
                key={user.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2.5fr 1fr 1fr',
                  padding: '13px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'center',
                  background: isSelf ? 'rgba(15,76,92,0.03)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => !isSelf && (e.currentTarget.style.background = 'var(--surface-inset)')}
                onMouseLeave={e => e.currentTarget.style.background = isSelf ? 'rgba(15,76,92,0.03)' : 'transparent'}
              >
                {/* Name + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: user.role === 'admin'
                      ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))'
                      : 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff',
                  }}>
                    {user.nama?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {user.nama}
                      {isSelf && (
                        <span style={{
                          marginLeft: 6, fontSize: 10,
                          background: 'rgba(15,76,92,0.1)',
                          color: 'var(--primary)',
                          padding: '1px 5px', borderRadius: 3,
                          fontWeight: 700,
                        }}>Anda</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div style={{
                  fontSize: 12, color: 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.email}
                </div>

                {/* Role badge */}
                <div><RoleBadge role={user.role} /></div>

                {/* Joined date */}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '—'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'right' }}>
          Menampilkan {filtered.length} dari {users.length} pengguna
        </p>
      )}
    </Layout>
  );
}
