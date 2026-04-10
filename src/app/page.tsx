'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="page active" id="page-landing" style={{ display: 'block' }}>
      <nav className="main-nav">
        <div className="flex items-center gap-3">
          <div className="logo-mark">🌿</div>
          <span className="logo-text">EcoTrace</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '13px', color: 'var(--muted)' }} className="hidden sm:inline">
            Waste Management &amp; Sustainability
          </span>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '14px' }}
          >
            Get Started →
          </button>
        </div>
      </nav>

      <div className="min-h-screen" style={{ padding: '0 24px' }}>
        {/* Hero */}
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 0 48px' }} className="anim-up text-center">
          <div className="flex items-center justify-center gap-2 mb-7" style={{ display: 'inline-flex' }}>
            <span
              style={{
                padding: '6px 16px',
                borderRadius: '999px',
                background: 'var(--light)',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid var(--light2)',
              }}
            >
              🌱 Ecological Footprint Assessment — 2025
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(38px,6vw,72px)',
              fontWeight: 800,
              lineHeight: 1.08,
              color: 'var(--primary-d)',
              marginBottom: '22px',
            }}
          >
            How many{' '}
            <span style={{ color: 'var(--accent)', position: 'relative' }}>
              Earths
              <svg
                style={{ position: 'absolute', bottom: '-3px', left: 0, width: '100%' }}
                viewBox="0 0 100 6"
              >
                <path d="M0,3 Q50,-1 100,3" stroke="#52B788" strokeWidth="2.5" fill="none" opacity="0.5" />
              </svg>
            </span>{' '}
            does your lifestyle need?
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: 'var(--muted)',
              lineHeight: 1.75,
              maxWidth: '560px',
              margin: '0 auto 44px',
            }}
          >
            Answer 27 simple questions about energy, transport, food &amp; lifestyle. Get your personalised carbon
            footprint score and actionable insights.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push('/login')}
              className="btn-primary"
              style={{ fontSize: '16px', padding: '15px 36px' }}
            >
              🌱 Start Assessment
            </button>
            <button
              onClick={() => document.getElementById('how-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-outline"
              style={{ fontSize: '15px', padding: '14px 28px' }}
            >
              How it works ↓
            </button>
          </div>

          {/* Stats */}
          <div style={{marginTop:"3.5rem"}} className="flex justify-center gap-10 mt-14 flex-wrap">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                4
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>Impact Categories</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                27
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>Questions</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                ~5 min
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>Quick Quiz</div>
            </div>
            <div style={{ width: '1px', background: 'var(--border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                PDF
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>
                Downloadable Report
              </div>
            </div>
          </div>
        </div>

        {/* Category cards */}
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 40px' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 text-center" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',padding:"10px" }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚡</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '5px' }}>
                Energy
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Electricity &amp; LPG consumption
              </div>
            </div>
            <div className="card p-5 text-center" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default', padding:"10px" }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚗</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '5px' }}>
                Transport
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Daily commute &amp; travel habits
              </div>
            </div>
            <div className="card p-5 text-center" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default', padding:"10px" }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🍽</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '5px' }}>
                Food &amp; Diet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Dietary choices &amp; food waste
              </div>
            </div>
            <div className="card p-5 text-center" style={{ transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default', padding:"10px" }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>♻️</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '5px' }}>
                Waste &amp; Lifestyle
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Clothing, packaging &amp; habits
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div id="how-section" style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 0 80px' }}>
          <div className="text-center mb-12">
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--primary-d)', marginBottom: '8px' }}>
              How it works
            </h2>
            <p style={{ color: 'var(--muted)' }}>Four steps from login to your personalised report</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5" style={{marginTop:"10px"}}>
            <div className="card p-8 text-center" style={{padding:"10px"}}>
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>🔐</div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  color: 'var(--accent)',
                  marginBottom: '6px',
                }}
              >
                STEP 01
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '7px' }}>Sign In</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Enter your Name, Emp ID &amp; Department to begin.
              </p>
            </div>
            <div className="card p-6 text-center" style={{padding:"10px"}}>
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>✅</div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  color: 'var(--accent)',
                  marginBottom: '6px',
                }}
              >
                STEP 02
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '7px' }}>Answer Quiz</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Click through 27 questions covering Energy, Transport, Food &amp; Waste.
              </p>
            </div>
            <div className="card p-6 text-center" style={{padding:"10px"}}>
              <div style={{ fontSize: '26px', marginBottom: '12px' }}>📊</div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  color: 'var(--amber)',
                  marginBottom: '6px',
                }}
              >
                STEP 03
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '7px' }}>See Results</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Get your CO₂ score, Earth count, and category breakdown.
              </p>
            </div>
            <div className="card p-6 text-center" style={{ borderColor: 'rgba(82,183,136,0.3)',padding:"10px" }}>
              <div style={{ fontSize: '26px', marginBottom: '12px' } }>📄</div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  color: 'var(--warm)',
                  marginBottom: '6px',
                }}
              >
                STEP 04
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '7px' }}>Download Report</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                Save a detailed PDF report with your full analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
