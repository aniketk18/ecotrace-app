'use client';

import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContext } from '@/components/ToastProvider';
import { CAT_META, MAX_WASTE_SCORE } from '@/utils/constants';

interface Option {
  emoji: string;
  label: string;
  weight: number;
}

interface Question {
  id: string;
  category: string;
  icon: string;
  order: number;
  question: string;
  text?: string;
  formula?: string;
  options: Option[];
}

export default function QuizPage() {
  const router = useRouter();
  const { showToast } = useContext(ToastContext);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [answerLabels, setAnswerLabels] = useState<Record<string, string>>({});
  const [answerWeights, setAnswerWeights] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);
  const qAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ecotrace_user');
    if (!storedUser) { router.push('/login'); return; }
    setUser(JSON.parse(storedUser));

    fetch('/api/questions')
      .then(r => r.json())
      .then(data => {
        const sorted = data.sort((a: Question, b: Question) => (a.order||0) - (b.order||0));
        setQuestions(sorted);
        setLoading(false);
      })
      .catch(() => { showToast('Failed to load questions', 'error'); setLoading(false); });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!questions.length) return;
      const q = questions[currentIndex];
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'INPUT')) {
        handleNext();
      }
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (q && q.options[idx]) selectOption(q.id, idx, q.options[idx].label, q.options[idx].weight);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [questions, currentIndex, answers, answerLabels, answerWeights]);

  const selectOption = useCallback((qId: string, optIdx: number, label: string, weight: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setAnswerLabels(prev => ({ ...prev, [qId]: label }));
    setAnswerWeights(prev => ({ ...prev, [qId]: weight }));
    // Auto-advance after 330ms
    const q = questions[currentIndex];
    if (questions.length && currentIndex < questions.length - 1) {
      setTimeout(() => {
        setAnimDir('right');
        setAnimKey(k => k + 1);
        setCurrentIndex(i => i + 1);
      }, 330);
    }
  }, [questions, currentIndex]);

  const handleNext = useCallback(() => {
    if (!questions.length) return;
    const q = questions[currentIndex];
    if (answers[q.id] === undefined) {
      showToast('Please select an option to continue', 'error');
      return;
    }
    if (currentIndex === questions.length - 1) {
      calculateAndSave();
    } else {
      setAnimDir('right');
      setAnimKey(k => k + 1);
      setCurrentIndex(i => i + 1);
    }
  }, [questions, currentIndex, answers, answerLabels, answerWeights]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setAnimDir('left');
      setAnimKey(k => k + 1);
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  async function calculateAndSave() {
    let energyCO2 = 0;
    ['e1','e2','e3','e4','e5'].forEach(id => { energyCO2 += answerWeights[id] || 0; });
    energyCO2 = Math.max(0, energyCO2);

    let transportCO2 = 0;
    ['t1','t2','t3'].forEach(id => { transportCO2 += answerWeights[id] || 0; });
    transportCO2 = Math.max(0, transportCO2);

    let foodCO2 = 0;
    ['f1','f2','f3','f4'].forEach(id => { foodCO2 += answerWeights[id] || 0; });
    foodCO2 = Math.max(0, foodCO2);

    let wasteScore = 0;
    ['w1','w2','w3','w4','w5','w6','w7','w8','w9','w10','w11','w12','w13','w14','w15']
      .forEach(id => { wasteScore += answerWeights[id] || 0; });
    const wasteCO2 = Math.round((wasteScore / MAX_WASTE_SCORE) * 80);

    const totalCO2 = Math.round(energyCO2 + transportCO2 + foodCO2 + wasteCO2);
    const earths = Math.max(0.3, Math.min(7, totalCO2 / 142));

    const catData = {
      energy:    { co2: Math.round(energyCO2),    pct: totalCO2 > 0 ? Math.round((energyCO2/totalCO2)*100) : 0 },
      transport: { co2: Math.round(transportCO2), pct: totalCO2 > 0 ? Math.round((transportCO2/totalCO2)*100) : 0 },
      food:      { co2: Math.round(foodCO2),       pct: totalCO2 > 0 ? Math.round((foodCO2/totalCO2)*100) : 0 },
      waste:     { co2: Math.round(wasteCO2),      pct: totalCO2 > 0 ? Math.round((wasteCO2/totalCO2)*100) : 0 },
    };

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, userName: user.name, empId: user.empId, dept: user.dept,
          answers, answerLabels, answerWeights,
          earths: parseFloat(earths.toFixed(2)), totalCO2, catData,
          questions: questions.map(q => ({ id: q.id, text: q.text || q.question })),
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        localStorage.setItem('ecotrace_results', JSON.stringify({
          earths: parseFloat(earths.toFixed(2)), totalCO2, catData,
          responseId: saved.responseId, answerLabels,
          questions: questions.map(q => ({ id: q.id, text: q.text || q.question })),
        }));
        router.push(`/report/${saved.responseId}`);
      } else {
        showToast('Failed to save. Please try again.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  }

  if (loading || !user || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌿</div>
          <div className="spinner" style={{ borderColor: 'rgba(45,106,79,0.2)', borderTopColor: 'var(--primary)', width: '28px', height: '28px', margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading quiz…</p>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const qText = q.text || q.question;
  const cat = CAT_META[q.category as keyof typeof CAT_META] || CAT_META.custom;
  const total = questions.length;
  const pct = Math.round(((currentIndex + 1) / total) * 100);
  const sel = answers[q.id];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav className="main-nav">
        <div className="flex items-center gap-3">
          <div className="logo-mark">🌿</div>
          <span className="logo-text">EcoTrace</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{
            fontSize: '13px', color: 'var(--muted)', background: 'var(--light)',
            padding: '5px 12px', borderRadius: '8px', fontWeight: 500,
          }}>
            {user.name} · {user.empId}
          </span>
          <button
            onClick={() => {
              if (!window.confirm('Are you sure you want to logout?')) return;
              localStorage.removeItem('ecotrace_user');
              router.push('/');
            }}
            className="btn-ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '660px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Progress header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className={`cat-pill ${cat.cls}`}>{cat.icon} {cat.label}</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{currentIndex + 1} / {total}</span>
        </div>
        <div className="progress-track mb-3" style={{margin:"10px 0"}}>
          <div className="progress-fill" style={{ width: `${pct}%` }}></div>
        </div>

        {/* Step dots */}
        <div className="flex gap-1 mb-8 flex-wrap" style={{margin:"10px 0"}}>
          {questions.map((_, idx) => (
            <div key={idx} className={`step-dot${idx === currentIndex ? ' active' : idx < currentIndex ? ' done' : ''}`}></div>
          ))}
        </div>

        {/* Question area — animated */}
        <div
          key={animKey}
          style={{ animation: `${animDir === 'left' ? 'slideInL' : 'slideInR'} 0.38s ease forwards` }}
        >
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: cat.color, marginBottom: '14px' }}>
              {cat.icon} {cat.label}
            </div>
            <h2 style={{ fontSize: 'clamp(19px,3vw,24px)', fontWeight: 700, lineHeight: 1.35, color: 'var(--primary-d)', marginBottom: '6px', fontFamily: "'Playfair Display', serif" }}>
              {q.icon ? `${q.icon} ` : ''}{qText}
            </h2>
            {q.formula && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>📐 {q.formula}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {q.options.map((opt, i) => (
              <div
                key={i}
                className={`option-card${sel === i ? ' selected' : ''}`}
                onClick={() => selectOption(q.id, i, opt.label, opt.weight)}
              >
                <div className="option-icon">{opt.emoji || '⭕'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    {opt.weight > 0 ? '+' : ''}{opt.weight} kg CO₂/month
                  </div>
                </div>
                <div className="check-ring">
                  {sel === i && (
                    <svg width="11" height="8" viewBox="0 0 11 8">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8 no-print" style={{margin:"10px 0"}}>
          <button
            id="btn-prev"
            onClick={handlePrev}
            className="btn-ghost"
            style={{ visibility: currentIndex === 0 ? 'hidden' : 'visible' }}
          >← Previous</button>
          <button id="btn-next" onClick={handleNext} className="btn-primary">
            {currentIndex === total - 1 ? '✓ See My Results' : 'Next →'}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-5" style={{ fontSize: '11px', color: 'var(--muted)', opacity: 0.7 }}>
          💡 Tip: Use number keys (1-{q.options.length}) to select, arrow keys to navigate
        </div>
      </div>
    </div>
  );
}
