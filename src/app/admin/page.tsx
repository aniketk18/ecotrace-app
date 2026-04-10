'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContext } from '@/components/ToastProvider';
import { CAT_META, earthIconsHTML } from '@/utils/constants';

declare global {
  interface Window {
    jspdf: any;
  }
}

const DEFAULT_PROMPT = `You are an expert Sustainability Analyst specializing in ESG (Environmental, Social, Governance), carbon footprint assessment, and behavioral impact analysis.

Your task is to analyze a user's sustainability report along with their questionnaire responses (questions + answers). Based on this data, identify root causes of environmental impact and map them to broader systemic consequences.

### INPUT:
You will receive:
1. A sustainability report (textual insights, observations, or summaries)
2. A set of user questions and their answers (behavioral data)

### OBJECTIVE:
Generate a structured analysis that identifies:
- Key impact areas
- Root causes (based on user behavior)
- Systemic environmental impact (macro-level consequences)

### ANALYSIS FRAMEWORK:

For each identified area, follow this structure:

-> Area: <Category Name>  
   (Examples: Energy, Transport, Waste, Food, Lifestyle, etc.)

-> Root Cause:
   - Identify specific user behaviors contributing to emissions or environmental harm
   - Use both report data and user answers to justify reasoning

-> Systemic Impact:
   - Explain broader environmental consequences
   - Map to real-world ESG effects such as:
     - Scope 1 / Scope 2 / Scope 3 emissions
     - Air pollution (PM2.5, NOx, etc.)
     - Fossil fuel dependency
     - Landfill methane emissions
     - Water pollution / microplastics
     - Resource depletion

### REQUIREMENTS:
- Be analytical, not descriptive
- Infer hidden patterns from user answers (not just direct statements)
- Use precise sustainability terminology
- Keep output structured and consistent
- Avoid generic statements

### OUTPUT FORMAT:

Root Cause & Environmental Impact Analysis:

-> Area: <Area Name>
   Root Cause: <Behavior-based reasoning> (it Should be of Max 2 Lines)
   Systemic Impact: <Macro-level ESG impact> (it Should be of Max 2 Lines)

(Repeat for all relevant areas)

---

Now analyze the given user report and responses and generate the structured output.
User Score: {{score}} Earths, Total CO2: {{totalCO2}} kg/month
User Category Breakdown: {{categories}}
User Answers:
{{answers}}`;

interface Question {
  _id?: string;
  id: string;
  category: string;
  icon: string;
  order: number;
  text: string;
  formula?: string;
  options: { emoji: string; label: string; weight: number }[];
}

interface Response {
  _id: string;
  id: number;
  userName: string;
  empId: string;
  dept?: string;
  earths: number;
  totalCO2: number;
  catData: any;
  answers?: Record<string, string>;
  questions?: { id: string; text: string }[];
  date?: string;
  createdAt?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useContext(ToastContext);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState<'questions' | 'responses' | 'formula' | 'settings'>('questions');

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('Add New Question');
  const [qText, setQText] = useState('');
  const [qIcon, setQIcon] = useState('❓');
  const [qFormula, setQFormula] = useState('');
  const [qCategory, setQCategory] = useState('energy');
  const [qOptions, setQOptions] = useState([
    { emoji: '', label: '', weight: 5 },
    { emoji: '', label: '', weight: 5 },
  ]);

  // Responses state
  const [responses, setResponses] = useState<Response[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingResponse, setViewingResponse] = useState<Response | null>(null);

  // Formula state
  const [efElectricity, setEfElectricity] = useState('0.82');
  const [efTransport, setEfTransport] = useState('0.15');
  const [efFood, setEfFood] = useState('5');
  const [efThreshold, setEfThreshold] = useState('142');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmPrompt, setLlmPrompt] = useState(DEFAULT_PROMPT);

  // Settings state
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  // Earth wallpaper toggle
  const [earthBg, setEarthBg] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('ecotrace_admin_token');
    if (!storedToken) { router.push('/login'); return; }
    setToken(storedToken);
    loadQuestions(storedToken);
    loadFormula(storedToken);
    // restore earth bg
    const bg = localStorage.getItem('ecotrace_earth_bg') === 'true';
    setEarthBg(bg);
    if (bg) document.body.classList.add('earth-bg');
  }, []);

  function toggleEarthWallpaper(val: boolean) {
    setEarthBg(val);
    document.body.classList.toggle('earth-bg', val);
    localStorage.setItem('ecotrace_earth_bg', String(val));
    showToast(val ? '🌍 Earth wallpaper enabled' : 'Wallpaper removed', 'success');
  }

  // ── QUESTIONS ──
  async function loadQuestions(tk?: string) {
    const t = tk || token;
    try {
      const res = await fetch('/api/admin/questions', { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setQuestions(await res.json());
    } catch { showToast('Failed to load questions', 'error'); }
  }

  function openAddQuestion() {
    setEditingId(null);
    setFormTitle('Add New Question');
    setQText(''); setQIcon('❓'); setQFormula(''); setQCategory('energy');
    setQOptions([{ emoji: '', label: '', weight: 5 }, { emoji: '', label: '', weight: 5 }, { emoji: '', label: '', weight: 5 }, { emoji: '', label: '', weight: 5 }]);
    setShowForm(true);
    setTimeout(() => document.getElementById('question-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function openEditQuestion(q: Question) {
    setEditingId(q._id || q.id);
    setFormTitle('Edit Question');
    setQText(q.text); setQIcon(q.icon || '❓'); setQFormula(q.formula || ''); setQCategory(q.category);
    setQOptions(q.options.map(o => ({ emoji: o.emoji || '', label: o.label, weight: o.weight })));
    setShowForm(true);
    setTimeout(() => document.getElementById('question-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function saveQuestion() {
    if (!qText.trim()) { showToast('Question text is required', 'error'); return; }
    const opts = qOptions.filter(o => o.label.trim());
    if (opts.length < 2) { showToast('At least 2 options required', 'error'); return; }
    const payload = { text: qText.trim(), icon: qIcon, formula: qFormula, category: qCategory, options: opts };
    const url = editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions';
    const method = editingId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(editingId ? 'Question updated!' : 'Question added!', 'success');
        setShowForm(false); setEditingId(null);
        loadQuestions();
      } else { showToast('Failed to save question', 'error'); }
    } catch { showToast('Network error', 'error'); }
  }

  async function deleteQuestion(id: string) {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showToast('Deleted', 'success'); loadQuestions(); }
    } catch { showToast('Failed to delete', 'error'); }
  }

  async function resetQuestions() {
    if (!window.confirm('Reset all questions to PDF defaults? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/questions/reset', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showToast('Questions reset to PDF defaults', 'success'); loadQuestions(); }
    } catch { showToast('Failed to reset', 'error'); }
  }

  // ── RESPONSES ──
  async function loadResponses() {
    setLoadingResponses(true);
    try {
      const res = await fetch('/api/admin/responses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setResponses(await res.json());
    } catch { showToast('Failed to load responses', 'error'); }
    setLoadingResponses(false);
  }

  function openUserModal(r: Response) {
    setViewingResponse(r);
    setModalOpen(true);
  }

  async function deleteResponse(id: string) {
    if (!window.confirm('Delete this response?')) return;
    try {
      const res = await fetch('/api/admin/responses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { showToast('Deleted', 'success'); loadResponses(); }
    } catch { showToast('Failed to delete', 'error'); }
  }

  async function clearAllResponses() {
    if (!window.confirm('Clear ALL responses? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/responses/clear', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showToast('Cleared', 'success'); setResponses([]); }
    } catch { showToast('Failed to clear', 'error'); }
  }

  function downloadUserPDF(r: Response) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { showToast('jsPDF not loaded', 'error'); return; }
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, PAD = 18;
    doc.setFillColor(27, 67, 50); doc.rect(0, 0, W, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('EcoTrace', PAD, 19);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(216, 243, 220);
    doc.text('Waste Management & Sustainability Report', PAD, 28);
    let y = 50;
    doc.setTextColor(27, 67, 50); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(`Employee: ${r.userName}`, PAD, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`ID: ${r.empId}  |  Dept: ${r.dept || 'N/A'}  |  Date: ${r.date || new Date(r.createdAt || '').toLocaleDateString()}`, PAD, y); y += 14;
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(45, 106, 79);
    doc.text(`Total CO2: ${r.totalCO2} kg/month   |   Earths: ${r.earths.toFixed(1)}`, PAD, y); y += 12;
    doc.setTextColor(27, 67, 50); doc.setFontSize(12);
    doc.text('Category Breakdown:', PAD, y); y += 8;
    Object.entries(r.catData || {}).forEach(([cat, d]: [string, any]) => {
      const meta = CAT_META[cat as keyof typeof CAT_META] || CAT_META.custom;
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`${meta.label}: ${d.co2} kg CO2 (${d.pct}%)`, PAD + 5, y); y += 7;
    });
    doc.save(`EcoTrace_${r.userName.replace(/\s+/g, '_')}_${r.empId}.pdf`);
    showToast('PDF downloaded!', 'success');
  }

  // ── FORMULA ──
  async function loadFormula(tk?: string) {
    const t = tk || token;
    try {
      const res = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.formula) {
          setEfElectricity(data.formula.electricity ?? '0.82');
          setEfTransport(data.formula.transport ?? '0.15');
          setEfFood(data.formula.food ?? '5');
          setEfThreshold(data.formula.threshold ?? '142');
        }
        if (data.llmApiKey !== undefined) setLlmApiKey(data.llmApiKey);
        if (data.llmPrompt) setLlmPrompt(data.llmPrompt);
      }
    } catch {}
  }

  async function saveFormula() {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ formula: { electricity: parseFloat(efElectricity), transport: parseFloat(efTransport), food: parseFloat(efFood), threshold: parseFloat(efThreshold) } }),
      });
      if (res.ok) showToast('Emission factors saved!', 'success');
    } catch { showToast('Failed to save', 'error'); }
  }

  async function saveLLMConfig() {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ llmApiKey, llmPrompt }),
      });
      if (res.ok) showToast('LLM config saved', 'success');
    } catch { showToast('Failed to save', 'error'); }
  }

  // ── SETTINGS ──
  async function changeAdminCreds() {
    if (!newAdminUser || !newAdminPass) { showToast('Both fields required', 'error'); return; }
    try {
      const res = await fetch('/api/admin/change-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newAdminUser, password: newAdminPass }),
      });
      if (res.ok) { showToast('Credentials updated', 'success'); setNewAdminUser(''); setNewAdminPass(''); }
      else showToast('Failed to update credentials', 'error');
    } catch { showToast('Network error', 'error'); }
  }

  async function fullReset() {
    if (!window.confirm('⚠️ This will delete ALL data (questions, responses, settings). Are you sure?')) return;
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showToast('Full reset complete', 'success'); setTimeout(() => router.push('/'), 800); }
    } catch { showToast('Failed to reset', 'error'); }
  }

  function handleLogout() {
    if (!window.confirm('Are you sure you want to logout?')) return;
    localStorage.removeItem('ecotrace_admin_token');
    router.push('/');
  }

  function switchTab(tab: typeof activeTab) {
    setActiveTab(tab);
    if (tab === 'responses') loadResponses();
    if (tab === 'formula') loadFormula();
  }

  const lvlColor = (co2: number) => co2 < 200 ? '#1B5E20' : co2 <= 400 ? '#E65100' : '#B71C1C';
  const lvlBg = (co2: number) => co2 < 200 ? '#E8F5E9' : co2 <= 400 ? '#FFF8E1' : '#FFEBEE';
  const lvlText = (co2: number) => co2 < 200 ? 'Low' : co2 <= 400 ? 'Medium' : 'High';

  const tabConfig = [
    { key: 'questions' as const, icon: '📋', label: 'Questions' },
    { key: 'responses' as const, icon: '📊', label: 'Responses' },
    { key: 'formula' as const, icon: '⚗️', label: 'Formula' },
    { key: 'settings' as const, icon: '⚙️', label: 'Settings' },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav className="main-nav">
        <div className="flex items-center gap-3">
          <div className="logo-mark">🌿</div>
          <span className="logo-text">EcoTrace</span>
          <span style={{ padding: '3px 10px', borderRadius: '6px', background: 'rgba(69,123,157,0.12)', color: 'var(--blue)', fontSize: '12px', fontWeight: 700 }}>ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Earth wallpaper toggle */}
          <div className="toggle-wrap">
            <span style={{ fontSize: '18px' }}>🌍</span>
            <label className="toggle">
              <input type="checkbox" id="earth-toggle" checked={earthBg} onChange={e => toggleEarthWallpaper(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Earth BG</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Admin tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              id={`atab-${tab.key}`}
              onClick={() => switchTab(tab.key)}
              className={activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '13px', padding: '10px 20px' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── QUESTIONS TAB ── */}
        {activeTab === 'questions' && (
          <div id="admin-questions" className="admin-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary-d)', fontFamily: "'Playfair Display', serif" }}>Question Bank</h2>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '3px' }}>27 default questions from PDF + custom additions</p>
              </div>
              <button onClick={openAddQuestion} className="btn-primary" style={{ fontSize: '13px', padding: '11px 20px' }}>+ Add Question</button>
            </div>

            {/* Add/Edit form */}
            {showForm && (
              <div id="question-form" className="card p-6 mb-6 anim-pop" style={{ borderColor: 'rgba(82,183,136,0.4)' }}>
                <h3 id="form-title" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '18px', fontFamily: "'Playfair Display', serif" }}>{formTitle}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="fp-label">Category</label>
                    <select id="q-category" className="fp-input" value={qCategory} onChange={e => setQCategory(e.target.value)}>
                      <option value="energy">⚡ Energy</option>
                      <option value="transport">🚗 Transport</option>
                      <option value="food">🍽 Food</option>
                      <option value="waste">♻️ Waste &amp; Lifestyle</option>
                      <option value="custom">✨ Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="fp-label">Icon Emoji</label>
                    <input id="q-icon" type="text" className="fp-input" placeholder="🌿" value={qIcon} onChange={e => setQIcon(e.target.value)} />
                  </div>
                  <div>
                    <label className="fp-label">Formula / Unit</label>
                    <input id="q-formula" type="text" className="fp-input" placeholder="e.g. kWh × 0.82" value={qFormula} onChange={e => setQFormula(e.target.value)} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="fp-label">Question Text</label>
                  <input id="q-text" type="text" className="fp-input" placeholder="Type your question here…" value={qText} onChange={e => setQText(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="fp-label">Answer Options (text, weight = kg CO₂ impact)</label>
                  <div id="options-list" className="flex flex-col gap-2 mb-3">
                    {qOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" className="fp-input" value={opt.emoji} onChange={e => { const o=[...qOptions]; o[idx].emoji=e.target.value; setQOptions(o); }} placeholder="🌿" style={{ width: '64px', flexShrink: 0, padding: '10px', textAlign: 'center', fontSize: '18px' }} />
                        <input type="text" className="fp-input" value={opt.label} onChange={e => { const o=[...qOptions]; o[idx].label=e.target.value; setQOptions(o); }} placeholder="Option text…" style={{ flex: 1 }} />
                        <input type="number" className="fp-input" value={opt.weight} onChange={e => { const o=[...qOptions]; o[idx].weight=parseFloat(e.target.value)||0; setQOptions(o); }} placeholder="Weight" step={1} style={{ width: '88px', flexShrink: 0 }} />
                        <button onClick={() => setQOptions(qOptions.filter((_, i) => i !== idx))} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setQOptions([...qOptions, { emoji: '', label: '', weight: 5 }])} className="btn-ghost" style={{ fontSize: '13px', padding: '8px 16px' }}>+ Add Option</button>
                </div>
                <div className="flex gap-3">
                  <button onClick={saveQuestion} id="save-q-btn" className="btn-primary" style={{ fontSize: '13px', padding: '11px 22px' }}>{editingId ? 'Update Question' : 'Save Question'}</button>
                  <button onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}

            {/* Questions list */}
            <div id="questions-list" className="flex flex-col gap-4">
              {questions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                  <p>No questions yet. Click &quot;+ Add Question&quot; to get started.</p>
                </div>
              ) : questions.map((q, i) => {
                const meta = CAT_META[q.category as keyof typeof CAT_META] || CAT_META.custom;
                return (
                  <div key={q._id || q.id} className="card p-5" style={{ transition: 'box-shadow 0.2s' }}>
                    <div className="flex items-start gap-4">
                      <div style={{ fontSize: '24px', marginTop: '2px' }}>{q.icon || '❓'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`cat-pill ${meta.cls}`}>{meta.icon} {meta.label}</span>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Q{i + 1}</span>
                          {q.formula && <span style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>📐 {q.formula}</span>}
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>{q.text}</h4>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((o, j) => (
                            <div key={j} className="tag-chip">
                              {o.emoji} {o.label}
                              <strong style={{ color: meta.barColor || meta.color, marginLeft: '4px' }}>{o.weight > 0 ? '+' : ''}{o.weight}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2" style={{ flexShrink: 0 }}>
                        <button onClick={() => openEditQuestion(q)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: '12px' }}>✏ Edit</button>
                        <button onClick={() => deleteQuestion(q._id || q.id)} className="btn-danger-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESPONSES TAB ── */}
        {activeTab === 'responses' && (
          <div id="admin-responses" className="admin-panel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary-d)', fontFamily: "'Playfair Display', serif" }}>Employee Responses</h2>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '3px' }}>Click any row for full analysis + PDF download</p>
              </div>
              <button onClick={clearAllResponses} className="btn-danger-sm">🗑 Clear All</button>
            </div>
            <div className="card" style={{ overflow: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Emp ID</th><th>Department</th>
                    <th>CO₂/month</th><th>Earths</th><th>Level</th><th>Date</th><th></th>
                  </tr>
                </thead>
                <tbody id="responses-tbody">
                  {loadingResponses ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
                      <div className="spinner" style={{ borderColor: 'rgba(45,106,79,0.2)', borderTopColor: 'var(--primary)', margin: '0 auto 8px' }}></div>
                      Loading…
                    </td></tr>
                  ) : responses.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>No responses yet.</td></tr>
                  ) : [...responses].sort((a, b) => (b as any).timestamp - (a as any).timestamp).map(r => (
                    <tr key={r._id} onClick={() => openUserModal(r)}>
                      <td style={{ fontWeight: 600 }}>{r.userName}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{r.empId}</td>
                      <td style={{ fontSize: '13px', color: 'var(--muted)' }}>{r.dept || 'N/A'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.totalCO2} kg</td>
                      <td style={{ fontWeight: 700 }}>{r.earths.toFixed(1)} 🌍</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: lvlBg(r.totalCO2), color: lvlColor(r.totalCO2) }}>
                          {lvlText(r.totalCO2)}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{r.date || new Date(r.createdAt || '').toLocaleDateString()}</td>
                      <td>
                        <button onClick={e => { e.stopPropagation(); deleteResponse(r._id); }} className="btn-danger-sm" style={{ padding: '4px 10px' }}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FORMULA TAB ── */}
        {activeTab === 'formula' && (
          <div id="admin-formula" className="admin-panel">
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '5px', fontFamily: "'Playfair Display', serif" }}>Analysis Formula</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Based on IPCC / GHG Protocol emission factors from your PDF</p>

            {/* Emission factors */}
            <div className="card p-6 mb-5">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px', fontFamily: "'Playfair Display', serif" }}>Emission Factors</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '18px' }}>Customise the calculation coefficients used in scoring</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="fp-label">Electricity (kg CO₂/kWh)</label>
                  <input id="ef-electricity" type="number" step="0.01" className="fp-input" value={efElectricity} onChange={e => setEfElectricity(e.target.value)} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Formula: kWh × 0.82 = kg CO₂</p>
                </div>
                <div>
                  <label className="fp-label">Transport (kg CO₂/km)</label>
                  <input id="ef-transport" type="number" step="0.01" className="fp-input" value={efTransport} onChange={e => setEfTransport(e.target.value)} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Formula: km/day × 30 × 0.15</p>
                </div>
                <div>
                  <label className="fp-label">Food (kg CO₂/non-veg meal)</label>
                  <input id="ef-food" type="number" step="0.5" className="fp-input" value={efFood} onChange={e => setEfFood(e.target.value)} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Formula: meals/month × 5</p>
                </div>
                <div>
                  <label className="fp-label">Sustainable Threshold (kg CO₂/month)</label>
                  <input id="ef-threshold" type="number" step="1" className="fp-input" value={efThreshold} onChange={e => setEfThreshold(e.target.value)} />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>= 1 Earth (1.7 tonnes CO₂/year)</p>
                </div>
              </div>
              <button onClick={saveFormula} className="btn-primary mt-5" style={{ fontSize: '13px', padding: '11px 22px' }}>Save Emission Factors</button>
            </div>

            {/* Classification thresholds */}
            <div className="card p-6 mb-5">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', fontFamily: "'Playfair Display', serif" }}>Classification Levels</h3>
              <div className="flex flex-col gap-3" style={{ fontSize: '14px' }}>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#E8F5E9', border: '1px solid #A5D6A7' }}>
                  <span style={{ fontSize: '20px' }}>🟢</span><div><strong>Low Impact</strong> — &lt; 200 kg CO₂/month (~1.4 Earths)</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF8E1', border: '1px solid #FFE082' }}>
                  <span style={{ fontSize: '20px' }}>🟡</span><div><strong>Medium Impact</strong> — 200–400 kg CO₂/month (1.4–2.8 Earths)</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFEBEE', border: '1px solid #EF9A9A' }}>
                  <span style={{ fontSize: '20px' }}>🔴</span><div><strong>High Impact</strong> — &gt; 400 kg CO₂/month (&gt; 2.8 Earths)</div>
                </div>
              </div>
            </div>

            {/* LLM config */}
            <div className="card p-6" style={{ borderColor: 'rgba(82,183,136,0.3)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: '22px' }}>🤖</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>LLM API Configuration</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Connect Gemini API for personalised reports</p>
                </div>
              </div>
              <div className="grid grid-cols-1 mb-4">
                <div>
                  <label className="fp-label">Gemini API Key</label>
                  <input type="password" id="llm-api-key" className="fp-input" placeholder="AIza…" value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="fp-label">System Prompt Template</label>
                <textarea id="llm-prompt" className="fp-input" rows={10} placeholder="…" value={llmPrompt} onChange={e => setLlmPrompt(e.target.value)} style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}></textarea>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>Use {'{{'}score{'}}'}, {'{{'}totalCO2{'}}'}, {'{{'}categories{'}}'}, {'{{'}answers{'}'} as variables</p>
              </div>
              <button onClick={saveLLMConfig} className="btn-primary mt-4" style={{ fontSize: '13px', padding: '11px 22px' }}>Save LLM Config</button>
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div id="admin-settings" className="admin-panel">
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '5px', fontFamily: "'Playfair Display', serif" }}>Settings</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '22px' }}>System configuration and data management</p>

            <div className="card p-6 mb-4">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>Change Admin Credentials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="fp-label">New Username</label>
                  <input id="new-admin-user" type="text" className="fp-input" placeholder="New username" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} />
                </div>
                <div>
                  <label className="fp-label">New Password</label>
                  <input id="new-admin-pass" type="password" className="fp-input" placeholder="New password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} />
                </div>
              </div>
              <button onClick={changeAdminCreds} className="btn-primary" style={{ fontSize: '13px', padding: '11px 22px' }}>Update Credentials</button>
            </div>

            <div className="card p-6 mb-4" style={{ borderColor: 'rgba(214,40,40,0.2)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger)', marginBottom: '4px', fontFamily: "'Playfair Display', serif" }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>Irreversible — proceed with caution</p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={resetQuestions} className="btn-danger-sm">↺ Reset to PDF Questions</button>
                <button onClick={clearAllResponses} className="btn-danger-sm">🗑 Clear All Responses</button>
                <button onClick={fullReset} className="btn-danger-sm" style={{ background: 'rgba(214,40,40,0.16)' }}>⚠ Full Data Reset</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {modalOpen && viewingResponse && (
        <div id="modal-user" className="modal-bg open" onClick={e => { if ((e.target as HTMLElement).id === 'modal-user') setModalOpen(false); }}>
          <div className="modal-box">
            <div style={{ background: 'linear-gradient(135deg,var(--primary),var(--accent))', padding: '24px 28px', borderRadius: '22px 22px 0 0' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="modal-title" style={{ fontSize: '20px', color: 'white', fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                    {viewingResponse.userName} — Footprint Report
                  </h3>
                  <p id="modal-sub" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>
                    {viewingResponse.empId} · {viewingResponse.dept || 'N/A'} · {viewingResponse.date || new Date(viewingResponse.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    id="modal-pdf-btn"
                    onClick={() => downloadUserPDF(viewingResponse!)}
                    style={{ background: 'white', color: 'var(--primary)', padding: '10px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >📄 Download PDF</button>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}
                  >×</button>
                </div>
              </div>
            </div>
            <div id="modal-body" style={{ padding: '24px 28px' }}>
              {/* Score summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg2)', borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', fontFamily: "'Playfair Display', serif" }}>{viewingResponse.earths.toFixed(1)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>EARTHS</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', letterSpacing: '4px' }} dangerouslySetInnerHTML={{ __html: earthIconsHTML(viewingResponse.earths) }}></div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                    {viewingResponse.totalCO2 < 200 ? 'LOW IMPACT 🟢' : viewingResponse.totalCO2 <= 400 ? 'MEDIUM IMPACT 🟡' : 'HIGH IMPACT 🔴'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{viewingResponse.totalCO2} kg CO₂/month</div>
                </div>
              </div>
              {/* Category breakdown */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>Category Breakdown</h4>
                {Object.entries(viewingResponse.catData || {}).map(([cat, d]: [string, any]) => {
                  const meta = CAT_META[cat as keyof typeof CAT_META] || CAT_META.custom;
                  return (
                    <div key={cat} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{meta.icon} {meta.label}</span>
                        <span style={{ fontSize: '13px', color: meta.barColor, fontWeight: 700 }}>{d.co2} kg ({d.pct}%)</span>
                      </div>
                      <div className="progress-track">
                        <div className="cat-bar-fill" style={{ width: `${d.pct}%`, background: meta.barColor }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Responses */}
              {viewingResponse.answers && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-d)', marginBottom: '10px', fontFamily: "'Playfair Display', serif" }}>Responses</h4>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.8 }}>
                    {Object.entries(viewingResponse.answers).map(([qId, ans]) => {
                      const qObj = (viewingResponse.questions || []).find(q => q.id === qId);
                      return (
                        <div key={qId} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{qObj ? qObj.text : qId}</span><br />
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>→ {ans}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
