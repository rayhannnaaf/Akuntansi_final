
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  );
}


export function StatCard({ label, value, icon, trend, color = 'var(--primary)' }) {
  return (
    <div style={{
      background: 'var(--surface-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        borderRadius: '0 0 0 80px',
        background: color + '12',
      }} />
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color, fontFamily: 'DM Mono, monospace' }}>
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: 11, color: trend > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
          {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

// Button
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled = false, style = {}, type = 'button' }) {
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--surface-inset)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: '#fff', border: 'none' },
    accent: { background: 'var(--accent)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  };
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 8,
        fontWeight: 600,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        cursor: disabled ? 'not-allowed': 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Badge
export function Badge({ children, color = 'default' }) {
  const colors = {
    default: { background: 'var(--surface-inset)', color: 'var(--text-secondary)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning)' },
    info: { background: 'var(--info-bg)', color: 'var(--info)' },
    primary: { background: '#e0f0f5', color: 'var(--primary)' },
  };
  return (
    <span style={{
      ...colors[color],
      padding: '2px 8px',
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

// Input
export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          padding: '8px 12px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 8,
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          fontSize: 13,
          transition: 'border-color 0.15s',
          outline: 'none',
          width: '100%',
          ...props.style,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--primary-light)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

// Select
export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        {...props}
        style={{
          padding: '8px 12px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 8,
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          fontSize: 13,
          outline: 'none',
          width: '100%',
          cursor: 'pointer',
          ...props.style,
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

// Table
export function Table({ headers, children, empty = 'Tidak ada data' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--surface)' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 14px', textAlign: 'left',
                fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 0.5,
                borderBottom: '1px solid var(--border)',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--surface)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </tr>
  );
}

export function Td({ children, right = false, mono = false }) {
  return (
    <td style={{
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--text-primary)',
      textAlign: right ? 'right' : 'left',
      fontFamily: mono ? 'DM Mono, monospace' : 'inherit',
    }}>
      {children}
    </td>
  );
}

// Loading Spinner
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid var(--surface-inset)',
        borderTop: '3px solid var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Empty State
export function Empty({ message = 'Tidak ada data', icon = '📭' }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}
