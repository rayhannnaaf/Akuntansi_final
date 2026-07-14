import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--primary-dark)',
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900,
          margin: '0 auto 16px',
        }}>A</div>
        <div style={{ fontSize: 14, opacity: 0.6 }}>Memuat...</div>
      </div>
    </div>
  );
}
