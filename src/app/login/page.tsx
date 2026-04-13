'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { ToastContext } from '@/components/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useContext(ToastContext);
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');

  // Employee form
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState('');
  const [dept, setDept] = useState('');

  // Admin form
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  async function loginUser() {
    if (!name.trim()) { showToast('Please enter your full name', 'error'); return; }
    if (!empId.trim()) { showToast('Please enter your Employee ID', 'error'); return; }
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), empId: empId.trim(), dept: dept || 'N/A' }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('ecotrace_user', JSON.stringify({ id: data.userId, name: name.trim(), empId: empId.trim(), dept: dept || 'N/A' }));
        router.push('/quiz');
      } else {
        showToast(data.message || 'Login failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setLoggingIn(false);
  }

  async function loginAdmin() {
    if (!adminUser.trim() || !adminPass) { showToast('Please fill in all fields', 'error'); return; }
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser.trim(), password: adminPass }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('ecotrace_admin_token', data.token);
        router.push('/admin');
      } else {
        showToast('Invalid credentials', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setLoggingIn(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '460px' }} className="anim-up">
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: '14px', fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif", marginBottom: '24px',
            display: 'block',
          }}
        >← Back to Home</button>

        {/* Tab toggle — matches reference exactly */}
        <div className="card" style={{ padding: '6px', marginBottom: '28px' }}>
          <div className="login-tab-toggle">
            <button
              id="tab-user"
              onClick={() => setActiveTab('user')}
              className={`login-tab-btn ${activeTab === 'user' ? 'active' : ''}`}
            >👤 Employee</button>
            <button
              id="tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`login-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            >🛡 Admin</button>
          </div>
        </div>

        {/* Employee Login */}
        {activeTab === 'user' && (
          <div id="login-user" className="login-form-card anim-pop">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '5px', fontFamily: "'Playfair Display', serif" }}>Welcome 👋</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>
              Enter your details to start the sustainability assessment
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="fp-label">Full Name</label>
                <input
                  id="user-name" type="text" className="fp-input"
                  placeholder="e.g. Aarav Sharma"
                  value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginUser()}
                />
              </div>
              <div>
                <label className="fp-label">Employee ID</label>
                <input
                  id="user-empid" type="text" className="fp-input"
                  placeholder="e.g. EMP001"
                  value={empId} onChange={e => setEmpId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginUser()}
                />
              </div>
              <div>
                <label className="fp-label">Department</label>
                <select
                  id="user-dept" className="fp-input"
                  value={dept} onChange={e => setDept(e.target.value)}
                >
                  <option value="">Select department…</option>
                  <option>E-COM</option>
                  <option>Operations</option>
                  <option>HR &amp; Admin</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>IT &amp; Digital</option>
                  <option>Management</option>
                  <option>Holistics and Wellness</option>
                  <option>Export</option>
                  <option>SCM</option>
                  <option>Civil</option>
                  <option>JLI</option>
                  <option>Pixxel</option>
                  <option>RND</option>
                  <option>DND</option>
                  <option>JRF</option>
                  <option>JR-Farms</option>
                  <option>Legal</option>
                  <option>Purchase</option>
                  <option>Packaging and Shipping</option>
                  <option>Studio</option>
                  <option>Other</option>
                </select>
              </div>
              <button
                onClick={loginUser}
                disabled={loggingIn}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '15px 30px', fontSize: '15px' }}
              >
                {loggingIn ? 'Starting…' : 'Start My Assessment →'}
              </button>
            </div>
          </div>
        )}

        {/* Admin Login */}
        {activeTab === 'admin' && (
          <div id="login-admin" className="login-form-card anim-pop">
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '5px', fontFamily: "'Playfair Display', serif" }}>Admin Portal 🛡</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '28px' }}>Authorised access only</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="fp-label">Username</label>
                <input
                  id="admin-user" type="text" className="fp-input"
                  placeholder="admin"
                  value={adminUser} onChange={e => setAdminUser(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loginAdmin()}
                />
              </div>
              <div>
                <label className="fp-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-pass" type={showPass ? 'text' : 'password'} className="fp-input"
                    placeholder="••••••••"
                    value={adminPass} onChange={e => setAdminPass(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loginAdmin()}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)',
                      fontSize: '16px', padding: '4px',
                    }}
                    title={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <p style={{
                fontSize: '12px', color: 'var(--muted)', padding: '10px 14px',
                background: 'var(--bg2)', borderRadius: '9px', border: '1px solid var(--border)',
              }}>
                🔑 Default: <strong>admin</strong> / <strong>admin123</strong>
              </p>
              <button
                onClick={loginAdmin}
                disabled={loggingIn}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '15px 30px', fontSize: '15px' }}
              >
                {loggingIn ? 'Signing in…' : 'Enter Dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
