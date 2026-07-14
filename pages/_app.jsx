import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '13px',
            background: '#0f4c5c',
            color: '#fff',
            borderRadius: '8px',
          },
          success: { iconTheme: { primary: '#e8a020', secondary: '#fff' } },
          error: { style: { background: '#c0392b' } },
        }}
      />
    </>
  );
}
