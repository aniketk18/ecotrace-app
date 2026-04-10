'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContext } from '@/components/ToastProvider';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useContext(ToastContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('ecotrace_admin_token', data.token);
        showToast('Administrator login successful', 'success');
        router.push('/admin');
      } else {
        showToast('Invalid credentials', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setIsLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }} className="anim-up">
        <button
          onClick={() => router.push('/')}
          className="btn-ghost mb-6"
          style={{ padding: '9px 0', border: 'none' }}
        >
          ← Back to Home
        </button>

        <div id="login-admin" className="card p-8">
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '5px' }}>Admin Portal 🛡</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '26px' }}>
            Authorised access only
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="fp-label">Username</label>
              <input
                id="admin-user"
                type="text"
                className="fp-input"
                placeholder="admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="fp-label">Password</label>
              <input
                id="admin-pass"
                type="password"
                className="fp-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--muted)',
                padding: '10px 14px',
                background: 'var(--bg2)',
                borderRadius: '9px',
                border: '1px solid var(--border)',
              }}
            >
              🔑 Default: <strong>admin</strong> / <strong>admin123</strong>
            </p>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="btn-primary w-full justify-center mt-1"
            >
              {isLoading ? 'Signing in…' : 'Enter Dashboard →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
