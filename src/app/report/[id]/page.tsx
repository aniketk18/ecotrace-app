'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ToastContext } from '@/components/ToastProvider';
import { earthIconsHTML, getClassification, CAT_META } from '@/utils/constants';

declare global {
  interface Window {
    Chart: any;
    jspdf: any;
  }
}

const CAT_COLORS: Record<string, string> = {
  energy: 'rgba(244,162,97,0.82)',
  transport: 'rgba(69,123,157,0.82)',
  food: 'rgba(82,183,136,0.82)',
  waste: 'rgba(231,111,81,0.82)',
  custom: 'rgba(155,93,229,0.82)',
};

function overShootDateLocal(earths: number): string {
  const day = Math.round(365 / earths);
  const d = new Date(new Date().getFullYear(), 0, day);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useContext(ToastContext);
  const [results, setResults] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [arcOffset, setArcOffset] = useState(439.8);
  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);
  const autoGenRef = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the user is viewing this from Admin context (they have a token)
    const adminToken = localStorage.getItem('ecotrace_admin_token');
    if (adminToken) {
      setIsAdmin(true);
    }
    
    // Fetch data from DB based on ID
    if (params?.id) {
      fetch(`/api/responses/${params.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Response not found');
          return res.json();
        })
        .then(data => {
          setUser({ name: data.userName, empId: data.empId, dept: data.dept });
          setResults({
            earths: data.earths,
            totalCO2: data.totalCO2,
            catData: data.catData,
            responseId: data._id,
            answerLabels: data.answerLabels || {},
            questions: data.questions || []
          });
          if (data.aiReport) {
            setAiReport(data.aiReport);
          }
          setLoading(false);
        })
        .catch(err => {
          showToast('Failed to load report data', 'error');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [params?.id]);

  // Animate ring after results load
  useEffect(() => {
    if (!results) return;
    const circ = 2 * Math.PI * 70;
    const pct = Math.min(results.earths / 5, 1);
    const timer = setTimeout(() => {
      setArcOffset(circ * (1 - pct));
    }, 400);
    return () => clearTimeout(timer);
  }, [results]);

  // Animate bars after load
  useEffect(() => {
    if (!results) return;
    const timer = setTimeout(() => {
      document.querySelectorAll('.cat-bar-fill[data-w]').forEach((el: any) => {
        el.style.width = el.dataset.w + '%';
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [results]);

  // Auto-generate AI report
  useEffect(() => {
    if (results && !aiReport && !aiLoading && !autoGenRef.current && !aiError) {
      autoGenRef.current = true;
      generateAIReport();
    }
  }, [results, aiReport, aiLoading, aiError]);

  // Chart.js doughnut
  useEffect(() => {
    if (!results || !chartRef.current) return;
    if (typeof window.Chart === 'undefined') return;

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    const entries = Object.entries(results.catData).filter(([, d]: any) => d.pct > 0) as [string, any][];
    chartInstanceRef.current = new window.Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: entries.map(([cat]) => (CAT_META[cat as keyof typeof CAT_META] || CAT_META.custom).label),
        datasets: [{
          data: entries.map(([, d]) => d.pct),
          backgroundColor: entries.map(([cat]) => CAT_COLORS[cat] || CAT_COLORS.custom),
          borderColor: 'white', borderWidth: 3,
        }]
      },
      options: {
        responsive: true, cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#5A8A6E', padding: 14, font: { family: 'DM Sans', size: 12 } } }
        }
      }
    });
  }, [results]);

  async function generateAIReport() {
    if (!results) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: results.earths, totalCO2: results.totalCO2,
          categories: results.catData, answers: results.answerLabels || {},
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.report);
        
        // Save the generated AI report back to the DB
        if (results.responseId) {
          try {
            await fetch(`/api/responses/${results.responseId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ aiReport: data.report })
            });
          } catch (e) {
            console.error('Failed to save AI report to DB', e);
          }
        }

        showToast('AI Analysis complete!', 'success');
      } else {
        setAiError(true);
        showToast('Failed to generate AI report or check API Key', 'error');
      }
    } catch {
      setAiError(true);
      showToast('AI Error — check console', 'error');
    }
    setAiLoading(false);
  }

  function downloadPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { showToast('jsPDF not loaded', 'error'); return; }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, PAD = 18;

    // Header
    doc.setFillColor(27, 67, 50);
    doc.rect(0, 0, W, 40, 'F');
    doc.setFillColor(45, 106, 79);
    doc.circle(W, 0, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('EcoTrace', PAD, 19);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.setTextColor(216, 243, 220);
    doc.text('Waste Management & Sustainability Report', PAD, 28);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - PAD, 28, { align: 'right' });

    // Employee Info
    let y = 50;
    doc.setFillColor(247, 251, 245);
    doc.setDrawColor(195, 223, 201); doc.setLineWidth(0.4);
    doc.roundedRect(PAD, y, W - PAD * 2, 34, 3, 3, 'FD');
    doc.setTextColor(27, 67, 50);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Employee Details', PAD + 6, y + 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold'); doc.text('Name:', PAD + 6, y + 19);
    doc.setFont('helvetica', 'normal'); doc.text(`${user?.name || ''}`, PAD + 20, y + 19);
    doc.setFont('helvetica', 'bold'); doc.text('Emp ID:', PAD + 90, y + 19);
    doc.setFont('helvetica', 'normal'); doc.text(`${user?.empId || ''}`, PAD + 106, y + 19);
    doc.setFont('helvetica', 'bold'); doc.text('Department:', PAD + 6, y + 27);
    doc.setFont('helvetica', 'normal'); doc.text(`${user?.dept || 'N/A'}`, PAD + 30, y + 27);
    doc.setFont('helvetica', 'bold'); doc.text('Date:', PAD + 90, y + 27);
    doc.setFont('helvetica', 'normal'); doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), PAD + 102, y + 27);

    // Score
    y += 44;
    doc.setFillColor(255, 255, 255); doc.setDrawColor(82, 183, 136); doc.setLineWidth(0.6);
    doc.roundedRect(PAD, y, W - PAD * 2, 42, 4, 4, 'FD');
    doc.setTextColor(27, 67, 50); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text('Total Carbon Footprint:  ', PAD + 4, y + 12);
    doc.setTextColor(45, 106, 79);
    doc.text(`${results.totalCO2} kg CO2 / month`, PAD + 64, y + 12);
    doc.setTextColor(27, 67, 50); doc.setFontSize(13);
    doc.text(`Earths Required: ${results.earths.toFixed(1)}`, PAD + 6, y + 23);

    const lvl = results.totalCO2 < 200 ? 'LOW IMPACT' : results.totalCO2 <= 400 ? 'MEDIUM IMPACT' : 'HIGH IMPACT';
    const lvlColor = results.totalCO2 < 200 ? [27, 94, 32] as [number,number,number] : results.totalCO2 <= 400 ? [230, 81, 0] as [number,number,number] : [183, 28, 28] as [number,number,number];
    const lvlBg = results.totalCO2 < 200 ? [232, 245, 233] as [number,number,number] : results.totalCO2 <= 400 ? [255, 248, 225] as [number,number,number] : [255, 235, 238] as [number,number,number];
    doc.setFillColor(...lvlBg); doc.setDrawColor(...lvlColor); doc.setLineWidth(0.3);
    doc.roundedRect(PAD + 6, y + 29, 45, 8, 2, 2, 'FD');
    doc.setTextColor(...lvlColor); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(lvl, PAD + 28, y + 34.5, { align: 'center' });
    doc.setTextColor(90, 138, 110); doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
    doc.text(`(If everyone lived like you, we'd need ${results.earths.toFixed(1)} Earths)`, PAD + 56, y + 34.5);

    // Category breakdown
    y += 52;
    doc.setTextColor(27, 67, 50); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('Category Breakdown', PAD, y);
    y += 6;
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(90, 138, 110);
    doc.text('Carbon Emission = Activity Data × Emission Factor', PAD, y);
    y += 9;
    const catColors: Record<string, [number,number,number]> = {
      energy: [244, 162, 97], transport: [69, 123, 157],
      food: [82, 183, 136], waste: [231, 111, 81], custom: [155, 93, 229]
    };
    Object.entries(results.catData).forEach(([cat, d]: [string, any]) => {
      const meta = CAT_META[cat as keyof typeof CAT_META] || CAT_META.custom;
      doc.setTextColor(45, 106, 79); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(meta.label, PAD, y + 4);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 138, 110);
      doc.text(`${d.co2} kg CO2 (${d.pct}%)`, PAD + 45, y + 4);
      doc.setFillColor(240, 247, 236); doc.setDrawColor(220, 235, 225); doc.setLineWidth(0.2);
      doc.roundedRect(PAD + 90, y, 80, 6, 3, 3, 'FD');
      const c = catColors[cat] || catColors.custom;
      if (d.pct > 0) { doc.setFillColor(...c); doc.roundedRect(PAD + 90, y, Math.max(2, (d.pct / 100) * 80), 6, 3, 3, 'F'); }
      y += 12;
    });

    // Formulas
    y += 5;
    doc.setFillColor(247, 251, 245); doc.setDrawColor(195, 223, 201); doc.setLineWidth(0.4);
    doc.roundedRect(PAD, y, W - PAD * 2, 26, 3, 3, 'FD');
    doc.setTextColor(27, 67, 50); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Formulas Applied:', PAD + 5, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 138, 110);
    doc.text('Electricity: kWh × 0.82 kg CO2    |    Travel: km/day × 30 × 0.15 kg CO2', PAD + 5, y + 14);
    doc.text('Food: non-veg meals/month × 5 kg CO2    |    Total = Energy + Transport + Food + Waste', PAD + 5, y + 21);

    // AI Report page
    if (aiReport) {
      doc.addPage();
      let yAI = 20;
      doc.setFillColor(27, 67, 50); doc.rect(0, 0, W, 25, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Root Cause & Environmental Impact', PAD, 16);
      yAI = 34;
      doc.setTextColor(27, 67, 50); doc.setFontSize(10.5); doc.setFont('helvetica', 'normal');
      const aiLines = doc.splitTextToSize(aiReport, W - PAD * 2);
      for (const line of aiLines) {
        if (yAI > 275) { doc.addPage(); yAI = 20; }
        doc.setFont('helvetica', line.startsWith('->') || line.includes('Root Cause:') || line.includes('Systemic Impact:') ? 'bold' : 'normal');
        doc.text(line, PAD, yAI);
        yAI += 6;
      }
    }

    // Questionnaire Answers page
    if (results.questions && results.questions.length > 0 && results.answerLabels) {
      doc.addPage();
      let yQA = 20;
      doc.setFillColor(27, 67, 50); doc.rect(0, 0, W, 25, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('Questionnaire Summary', PAD, 16);
      yQA = 34;

      results.questions.forEach((q: any, idx: number) => {
        if (yQA > 265) { doc.addPage(); yQA = 20; }
        
        doc.setTextColor(27, 67, 50); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        const qTextLines = doc.splitTextToSize(`${idx + 1}. ${q.text}`, W - PAD * 2);
        doc.text(qTextLines, PAD, yQA);
        yQA += qTextLines.length * 6;
        
        const ans = results.answerLabels[q.id] || 'No answer provided';
        doc.setTextColor(69, 123, 157); doc.setFontSize(10.5); doc.setFont('helvetica', 'normal');
        const ansLines = doc.splitTextToSize(`Answer: ${ans}`, W - PAD * 2 - 6);
        doc.text(ansLines, PAD + 6, yQA);
        yQA += ansLines.length * 6 + 6;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(240, 247, 236); doc.rect(0, 285, W, 12, 'F');
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 138, 110);
      doc.text('EcoTrace — Waste Management & Sustainability', PAD, 292);
      doc.text(`Page ${i} of ${totalPages}`, W - PAD, 292, { align: 'right' });
    }

    doc.save(`EcoTrace_Report_${(user?.name || 'User').replace(/\s+/g, '_')}_${user?.empId || ''}.pdf`);
    showToast('PDF downloaded!', 'success');
  }

  if (loading || !results || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌍</div>
          <div className="spinner" style={{ borderColor: 'rgba(45,106,79,0.2)', borderTopColor: 'var(--primary)', width: '28px', height: '28px', margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading report…</p>
        </div>
      </div>
    );
  }

  const classification = getClassification(results.earths);
  let interp = '', overshootText = '';
  if (results.totalCO2 < 200) {
    interp = "🟢 Excellent! You're living close to a sustainable footprint.";
    overshootText = 'Your Earth Overshoot Day falls near the end of the year — keep it up!';
  } else if (results.totalCO2 <= 400) {
    interp = '🟡 Moderate impact — some targeted changes can make a real difference.';
    overshootText = `Your personal Earth Overshoot Day is around ${overShootDateLocal(results.earths)}.`;
  } else {
    interp = '🔴 High impact — urgent lifestyle changes are strongly recommended.';
    overshootText = `Your personal Earth Overshoot Day is as early as ${overShootDateLocal(results.earths)}.`;
  }

  const interpColor = results.totalCO2 < 200 ? '#1B5E20' : results.totalCO2 <= 400 ? '#E65100' : '#B71C1C';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav className="main-nav no-print">
        <div className="flex items-center gap-3">
          <div className="logo-mark">🌿</div>
          <span className="logo-text">EcoTrace</span>
        </div>
        <div className="flex gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => router.push('/admin')}
                className="btn-ghost" style={{ padding: '9px 18px', fontSize: '13px' }}>
                ↩ Back to Admin
              </button>
              <button onClick={downloadPDF} disabled={!aiReport} className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', opacity: !aiReport ? 0.5 : 1, cursor: !aiReport ? 'not-allowed' : 'pointer' }}>
                📄 Download PDF
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/quiz')}
                className="btn-ghost" style={{ padding: '9px 18px', fontSize: '13px' }}>
                ↩ Retake
              </button>
              <button onClick={downloadPDF} disabled={!aiReport} className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', opacity: !aiReport ? 0.5 : 1, cursor: !aiReport ? 'not-allowed' : 'pointer' }}>
                📄 Download PDF
              </button>
              <button
                onClick={() => {
                  if (!window.confirm('Are you sure you want to logout?')) return;
                  localStorage.removeItem('ecotrace_user');
                  router.push('/');
                }}
                className="btn-ghost" style={{ padding: '9px 14px', fontSize: '13px' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Header */}
        <div className="text-center mb-10 anim-up">
          <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.09em', color: 'var(--accent)', marginBottom: '8px' }}>
            YOUR RESULTS ARE IN
          </div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: 'var(--primary-d)', marginBottom: '8px', fontFamily: "'Playfair Display', serif" }}>
            {user.name}&apos;s Footprint Report 🌐
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Based on the IPCC / GHG Protocol emission factors</p>
        </div>

        {/* Score hero card */}
        <div className="card p-8 mb-6 anim-up" style={{ background: 'linear-gradient(135deg,#EAF6EF 0%,white 100%)' , padding:"1.5rem",margin:"10px 0"}}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Earth ring — animated SVG */}
            <div style={{ position: 'relative', width: '170px', height: '170px', flexShrink: 0 }}>
              <svg viewBox="0 0 170 170" width="170" height="170" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="85" cy="85" r="70" fill="none" stroke="#D8F3DC" strokeWidth="12"/>
                <circle id="earth-arc" cx="85" cy="85" r="70" fill="none"
                  stroke="url(#greenGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="439.8" strokeDashoffset={arcOffset}
                  style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.34,1.56,0.64,1)' }}/>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#52B788"/>
                    <stop offset="100%" stopColor="#2D6A4F"/>
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '38px', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
                  {results.earths.toFixed(1)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>EARTHS</span>
              </div>
            </div>

            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={classification.badge}>
                  {results.totalCO2 < 200 ? 'Low Impact' : results.totalCO2 <= 400 ? 'Medium Impact' : 'High Impact'}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--muted)' }}>{results.totalCO2} kg CO₂/month</span>
              </div>
              <div className="earth-icons-row mb-4" dangerouslySetInnerHTML={{ __html: earthIconsHTML(results.earths) }}></div>
              <p style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.6, color: interpColor, marginBottom: '8px' }}>{interp}</p>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>{overshootText}</p>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-7 mb-6 anim-up" style={{padding:"1.5rem",margin:"10px 0"}}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '18px', fontFamily: "'Playfair Display', serif" }}>📊 Category Breakdown</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>Carbon Emission = Activity Data × Emission Factor (IPCC / GHG Protocol)</p>
          <div className="flex flex-col gap-5">
            {Object.entries(results.catData).map(([cat, d]: [string, any]) => {
              const meta = CAT_META[cat as keyof typeof CAT_META] || CAT_META.custom;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{meta.icon}</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{meta.label}</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{d.co2} kg CO₂/month</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: meta.barColor }}>{d.pct}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="cat-bar-fill" data-w={d.pct} style={{ width: '0%', background: meta.barColor }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="card p-7 mb-6 anim-up" style={{padding:"1.5rem",margin:"10px 0"}}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '18px', fontFamily: "'Playfair Display', serif" }}>🌐 Emission Distribution</h3>
          <div style={{ maxWidth: '280px', margin: '0 auto' }}>
            <canvas id="result-chart" ref={chartRef}></canvas>
          </div>
        </div>

        {/* AI Report */}
        <div className="card p-7 mb-6 anim-up" style={{ borderColor: 'rgba(82,183,136,0.3)',padding:"1.5rem",margin:"10px 0" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-d)', fontFamily: "'Playfair Display', serif" }}>🤖 AI-Powered Report</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>Personalised Root Cause &amp; Environmental Impact</p>
            </div>
          </div>
          {!aiReport ? (
            <div id="ai-placeholder" className="ai-dashed">
              <div style={{ fontSize: '42px', marginBottom: '12px' }}>🧠</div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', fontFamily: "'Playfair Display', serif" }}>Root Cause &amp; Environmental Impact</h4>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '440px', margin: '0 auto 16px' }}>
                Generating your personalised sustainability impact analysis based on your answers...
              </p>
              {aiError ? (
                <button
                  id="btn-gen-ai"
                  onClick={() => { setAiError(false); autoGenRef.current = false; }}
                  className="btn-primary"
                  style={{ fontSize: '13px', padding: '10px 20px' }}
                >
                  Retry Generation
                </button>
              ) : (
                <div className="flex justify-center items-center gap-2" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600 }}>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                  Generating AI Report...
                </div>
              )}
            </div>
          ) : (
            <div id="ai-report-content" style={{
              marginTop: '20px', padding: '20px', background: 'var(--bg2)',
              borderRadius: '14px', fontSize: '14px', lineHeight: 1.7,
              whiteSpace: 'pre-wrap', border: '1px solid var(--border)',
              color: 'var(--text)',
            }}>
              {aiReport}
            </div>
          )}
        </div>

        {/* Bottom buttons */}
        <div className="flex gap-3 justify-center flex-wrap no-print" style={{ marginTop: '12px' }}>
          {isAdmin ? (
            <button onClick={() => router.push('/admin')} className="btn-ghost">↩ Back to Admin</button>
          ) : (
            <button onClick={() => router.push('/quiz')} className="btn-ghost">↩ Retake Quiz</button>
          )}
          <button onClick={downloadPDF} disabled={!aiReport} className="btn-primary" style={{ opacity: !aiReport ? 0.5 : 1, cursor: !aiReport ? 'not-allowed' : 'pointer' }}>
            📄 Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
