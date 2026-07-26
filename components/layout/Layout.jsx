import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUser, signOut } from '../../lib/auth-client';
import toast from 'react-hot-toast';

const MENU = [
  { href: '/dashboard',             label: 'Dashboard',    icon: '⊞', adminOnly: false },
  { href: '/transaksi',             label: 'Transaksi',    icon: '⇄', adminOnly: false },
  { href: '/jurnal',                label: 'Buku Jurnal',  icon: '▤', adminOnly: false },
  { href: '/akun',                  label: 'Daftar Akun',  icon: '◈', adminOnly: false },
  { href: '/laporan/neraca-saldo',  label: 'Neraca Saldo', icon: '⊟', adminOnly: false },
  { href: '/laporan/laba-rugi',     label: 'Laba Rugi',    icon: '↑↓', adminOnly: false },
  { href: '/laporan/neraca',        label: 'Neraca',       icon: '⊜', adminOnly: false },
  { href: '/manajemen-user',        label: 'Manajemen User', icon: '👥', adminOnly: true },
];

function LogoutDialog({ onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 32px',
          width: 320,
          boxShadow: '0 16px 48px rgba(0,0,0,0.24)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)', marginBottom: 8 }}>
          Keluar dari sistem?
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          Sesi Anda akan diakhiri. Anda perlu login kembali untuk mengakses sistem.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              background: 'var(--surface-inset)',
              border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 600,
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              background: 'var(--danger)',
              border: 'none', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, title = 'Pencatatan' }) {
  const router = useRouter();
  const [profile, setProfile]           = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [showLogout, setShowLogout]     = useState(false);
  const [loggingOut, setLoggingOut]     = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setProfile(user);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    signOut();
    toast.success('Berhasil keluar. Sampai jumpa!');
    router.replace('/login');
  };

  const visibleMenu = MENU.filter(item =>
    !item.adminOnly || profile?.role === 'admin'
  );

  return (
    <>
      {showLogout && (
        <LogoutDialog
          onConfirm={handleLogout}
          onCancel={() => !loggingOut && setShowLogout(false)}
        />
      )}

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>

        <aside style={{
          width: sidebarOpen ? 'var(--sidebar-width)' : '60px',
          background: 'var(--primary-dark)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 100,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}>

          <div style={{
            padding: sidebarOpen ? '20px 20px 16px' : '20px 12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--accent)', flexShrink: 0,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: '#fff',
              }}>A</div>
              {sidebarOpen && (
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                    Pencatatan
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                    Sistem Pencatatan
                  </div>
                </div>
              )}
            </div>
          </div>

          <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            {visibleMenu.map(item => {
              const active = router.pathname.startsWith(item.href);
              const isAdmin = item.adminOnly;
              return (
                <Link key={item.href} href={item.href}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: sidebarOpen ? '9px 20px' : '9px 14px',
                    margin: '1px 8px',
                    borderRadius: 8,
                    background: active
                      ? 'rgba(232,160,32,0.18)'
                      : 'transparent',
                    color: active
                      ? 'var(--accent-light)'
                      : isAdmin
                        ? 'rgba(232,160,32,0.75)'
                        : 'rgba(255,255,255,0.6)',
                    fontWeight: active ? 600 : 400,
                    fontSize: 13,
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderLeft: active
                      ? '2px solid var(--accent)'
                      : isAdmin
                        ? '2px solid rgba(232,160,32,0.25)'
                        : '2px solid transparent',
                  }}>
                    <span style={{
                      fontSize: 15, flexShrink: 0,
                      width: 20, textAlign: 'center',
                    }}>{item.icon}</span>
                    {sidebarOpen && (
                      <span>
                        {item.label}
                        {isAdmin && sidebarOpen && (
                          <span style={{
                            marginLeft: 6, fontSize: 9,
                            background: 'rgba(232,160,32,0.3)',
                            color: 'var(--accent-light)',
                            padding: '1px 5px', borderRadius: 3,
                            fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: 0.4, verticalAlign: 'middle',
                          }}>admin</span>
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div style={{
            padding: sidebarOpen ? '14px 16px' : '14px 10px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            {sidebarOpen && profile ? (
              <>
                <div style={{
                  color: 'rgba(255,255,255,0.45)', fontSize: 10,
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                  Akun Anda
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: profile.role === 'admin'
                      ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))'
                      : 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {profile.nama?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{
                      color: '#fff', fontWeight: 600, fontSize: 12,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {profile.nama}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      background: profile.role === 'admin'
                        ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                      color: '#fff', fontSize: 9,
                      padding: '1px 6px', borderRadius: 3,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5, fontWeight: 700,
                    }}>
                      {profile.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowLogout(true)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6,
                    width: '100%', padding: '7px 12px',
                    background: 'rgba(192,57,43,0.18)',
                    color: '#f08070',
                    border: '1px solid rgba(192,57,43,0.3)',
                    borderRadius: 7,
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.32)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,57,43,0.18)'}
                >
                  <span style={{ fontSize: 13 }}>⎋</span> Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogout(true)}
                title="Keluar"
                style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'rgba(192,57,43,0.18)',
                  border: '1px solid rgba(192,57,43,0.3)',
                  color: '#f08070', fontSize: 16,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                ⎋
              </button>
            )}
          </div>
        </aside>

        <div style={{
          marginLeft: sidebarOpen ? 'var(--sidebar-width)' : '60px',
          flex: 1, transition: 'margin-left 0.2s ease',
          display: 'flex', flexDirection: 'column',
          minHeight: '100vh',
        }}>
          <header style={{
            height: 'var(--header-height)',
            background: 'var(--surface-raised)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center',
            padding: '0 24px', gap: 12,
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: 'var(--surface-inset)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16, color: 'var(--text-secondary)',
              }}
            >☰</button>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
              {title}
            </h1>

            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => setShowLogout(true)}
                title="Keluar"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 7,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--danger-bg)';
                  e.currentTarget.style.color = 'var(--danger)';
                  e.currentTarget.style.borderColor = 'var(--danger)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <span>⎋</span>
                {profile?.nama ? `Keluar (${profile.nama.split(' ')[0]})` : 'Keluar'}
              </button>
            </div>
          </header>

          <main style={{ flex: 1, padding: '24px' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}