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

  // Logout confirm
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    localStorage.removeItem('ecotrace_admin_token');
    router.push('/login');
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

  // ── SHARED STYLES ──
  const S = {
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: '64px',
      background: '#ffffff', borderBottom: '1px solid #e8f0e9',
      boxShadow: '0 1px 4px rgba(45,106,79,0.06)', position: 'sticky' as const, top: 0, zIndex: 100,
    },
    logoWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoMark: {
      width: '36px', height: '36px', borderRadius: '10px',
      background: 'linear-gradient(135deg,#2d6a4f,#52b788)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
    },
    logoText: { fontSize: '20px', fontWeight: 800, color: '#1b4332', letterSpacing: '-0.3px', fontFamily: "'DM Sans', sans-serif" },
    adminBadge: {
      padding: '3px 10px', borderRadius: '6px',
      background: 'rgba(69,123,157,0.13)', color: '#3a6fa8',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
    },
    navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
    toggleWrap: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoutBtn: {
      padding: '8px 18px', borderRadius: '10px', border: '1px solid #d1e7dd',
      background: 'transparent', color: '#2d6a4f', fontSize: '13px', fontWeight: 600,
      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    },
    container: { maxWidth: '980px', margin: '0 auto', padding: '32px 24px' },
    tabRow: { display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' as const },
    tabActive: {
      padding: '10px 22px', borderRadius: '12px', border: 'none',
      background: '#2d6a4f', color: '#ffffff',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '7px',
    },
    tabInactive: {
      padding: '10px 22px', borderRadius: '12px', border: '1.5px solid #d1e7dd',
      background: '#ffffff', color: '#2d6a4f',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '7px',
    },
    pageTitle: { fontSize: '22px', fontWeight: 700, color: '#1b4332', fontFamily: "'Playfair Display', serif", marginBottom: '4px' },
    pageSub: { fontSize: '14px', color: '#6c757d', marginBottom: '0' },
    card: {
      background: '#ffffff', borderRadius: '16px',
      border: '1px solid #e8f0e9', boxShadow: '0 1px 4px rgba(45,106,79,0.05)',
      overflow: 'hidden' as const,
    },
    cardPad: { padding: '24px' },
    label: { fontSize: '11px', fontWeight: 700, color: '#6c757d', letterSpacing: '0.6px', textTransform: 'uppercase' as const, display: 'block', marginBottom: '7px' },
    input: {
      width: '100%', padding: '11px 14px', borderRadius: '10px',
      border: '1.5px solid #dce8e0', background: '#f8fdf9',
      fontSize: '14px', color: '#1b4332', outline: 'none',
      fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' as const,
    },
    btnPrimary: {
      padding: '11px 24px', borderRadius: '11px', border: 'none',
      background: '#2d6a4f', color: '#ffffff',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
    },
    btnGhost: {
      padding: '9px 20px', borderRadius: '11px', border: '1.5px solid #d1e7dd',
      background: '#ffffff', color: '#2d6a4f',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
    },
    btnDangerSm: {
      padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(214,40,40,0.25)',
      background: 'rgba(214,40,40,0.07)', color: '#c62828',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
    },
    btnDel: {
      padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(214,40,40,0.25)',
      background: '#fff', color: '#c62828',
      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif",
    },
  };

  return (
    <div style={{ background: '#f4faf6', minHeight: '100vh' }}>

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div style={S.logoWrap}>
          <div style={S.logoMark}>🌿</div>
          <span style={S.logoText}>EcoTrace</span>
          <span style={S.adminBadge}>ADMIN</span>
        </div>
        <div style={S.navRight}>
          <div style={S.toggleWrap}>
            <span style={{ fontSize: '18px' }}>🌍</span>
            <label className="toggle" style={{ margin: 0 }}>
              <input type="checkbox" id="earth-toggle" checked={earthBg} onChange={e => toggleEarthWallpaper(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
            <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600 }}>Earth BG</span>
          </div>
          <button onClick={handleLogout} style={S.logoutBtn}>Logout</button>
        </div>
      </nav>

      <div style={S.container}>

        {/* ── TABS ── */}
        <div style={S.tabRow}>
          {tabConfig.map(tab => (
            <button
              key={tab.key}
              id={`atab-${tab.key}`}
              onClick={() => switchTab(tab.key)}
              style={activeTab === tab.key ? S.tabActive : S.tabInactive}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ══ QUESTIONS TAB ══ */}
        {activeTab === 'questions' && (
          <div id="admin-questions">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={S.pageTitle}>Question Bank</h2>
                <p style={S.pageSub}>27 default questions from PDF + custom additions</p>
              </div>
              <button onClick={openAddQuestion} style={S.btnPrimary}>+ Add Question</button>
            </div>

            {/* Add / Edit form */}
            {showForm && (
              <div id="question-form" style={{ ...S.card, ...S.cardPad, marginBottom: '20px', borderColor: 'rgba(82,183,136,0.35)' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1b4332', marginBottom: '20px', fontFamily: "'Playfair Display', serif" }}>{formTitle}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={S.label}>Category</label>
                    <select id="q-category" style={S.input} value={qCategory} onChange={e => setQCategory(e.target.value)}>
                      <option value="energy">⚡ Energy</option>
                      <option value="transport">🚗 Transport</option>
                      <option value="food">🍽 Food</option>
                      <option value="waste">♻️ Waste &amp; Lifestyle</option>
                      <option value="custom">✨ Custom</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Icon Emoji</label>
                    <input id="q-icon" type="text" style={{ ...S.input, fontSize: '20px', textAlign: 'center' }} placeholder="🌿" value={qIcon} onChange={e => setQIcon(e.target.value)} />
                  </div>
                  <div>
                    <label style={S.label}>Formula / Unit</label>
                    <input id="q-formula" type="text" style={S.input} placeholder="e.g. kWh × 0.82" value={qFormula} onChange={e => setQFormula(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={S.label}>Question Text</label>
                  <input id="q-text" type="text" style={S.input} placeholder="Type your question here…" value={qText} onChange={e => setQText(e.target.value)} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={S.label}>Answer Options (Text, Weight = kg CO₂ Impact)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {qOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '10px',
                          background: '#f0f9f4', border: '1.5px solid #d1e7dd',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', flexShrink: 0, cursor: 'pointer',
                        }}>
                          <input type="text" value={opt.emoji}
                            onChange={e => { const o=[...qOptions]; o[idx].emoji=e.target.value; setQOptions(o); }}
                            placeholder="🌿"
                            style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: '20px', cursor: 'pointer' }}
                          />
                        </div>
                        <input type="text" value={opt.label}
                          onChange={e => { const o=[...qOptions]; o[idx].label=e.target.value; setQOptions(o); }}
                          placeholder="Option text…"
                          style={{ ...S.input, flex: 1 }}
                        />
                        <input type="number" value={opt.weight}
                          onChange={e => { const o=[...qOptions]; o[idx].weight=parseFloat(e.target.value)||0; setQOptions(o); }}
                          placeholder="41"
                          style={{ ...S.input, width: '80px', flexShrink: 0 }}
                        />
                        <button onClick={() => setQOptions(qOptions.filter((_, i) => i !== idx))}
                          style={{ color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setQOptions([...qOptions, { emoji: '', label: '', weight: 5 }])}
                    style={{ ...S.btnGhost, fontSize: '13px', padding: '8px 16px' }}>+ Add Option</button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={saveQuestion} id="save-q-btn" style={S.btnPrimary}>{editingId ? 'Update Question' : 'Save Question'}</button>
                  <button onClick={() => { setShowForm(false); setEditingId(null); }} style={S.btnGhost}>Cancel</button>
                </div>
              </div>
            )}

            {/* Questions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {questions.length === 0 ? (
                <div style={{ ...S.card, ...S.cardPad, textAlign: 'center', color: '#6c757d' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                  <p>No questions yet. Click &quot;+ Add Question&quot; to get started.</p>
                </div>
              ) : questions.map((q, i) => {
                const meta = CAT_META[q.category as keyof typeof CAT_META] || CAT_META.custom;
                return (
                  <div key={q._id || q.id} style={{ ...S.card, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      {/* Left: standalone question icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: '#f0f9f4', border: '1px solid #dce8e0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0, marginTop: '2px',
                      }}>
                        {q.icon || meta.icon}
                      </div>
                      {/* Body */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          {/* Category pill */}
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                            letterSpacing: '0.4px', background: meta.cls === 'cat-energy' ? '#fff3e0' : meta.cls === 'cat-transport' ? '#e3f2fd' : meta.cls === 'cat-food' ? '#f3e5f5' : meta.cls === 'cat-waste' ? '#e8f5e9' : '#f5f5f5',
                            color: meta.cls === 'cat-energy' ? '#e65100' : meta.cls === 'cat-transport' ? '#1565c0' : meta.cls === 'cat-food' ? '#6a1b9a' : meta.cls === 'cat-waste' ? '#1b5e20' : '#424242',
                            border: `1px solid ${meta.cls === 'cat-energy' ? '#ffcc80' : meta.cls === 'cat-transport' ? '#90caf9' : meta.cls === 'cat-food' ? '#ce93d8' : meta.cls === 'cat-waste' ? '#a5d6a7' : '#e0e0e0'}`,
                          }}>
                            {meta.icon} {meta.label.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: 600 }}>Q{i + 1}</span>
                          {q.formula && (
                            <span style={{ fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                              📐 {q.formula}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1b4332', marginBottom: '14px', lineHeight: 1.4 }}>{q.text}</h4>
                        {/* Option chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {q.options.map((o, j) => {
                            let bg = '#e8f5e9', border = '#a5d6a7', txt = '#1b5e20';
                            if (o.weight > 30 && o.weight <= 100) { bg = '#fff8e1'; border = '#ffe082'; txt = '#e65100'; }
                            else if (o.weight > 100) { bg = '#ffebee'; border = '#ef9a9a'; txt = '#c62828'; }
                            else if (o.weight < 0) { bg = '#e8f5e9'; border = '#81c784'; txt = '#2e7d32'; }
                            return (
                              <div key={j} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '5px 12px', borderRadius: '8px',
                                background: bg, border: `1px solid ${border}`,
                                fontSize: '13px',
                              }}>
                                <span>{o.emoji}</span>
                                <span style={{ color: '#333', fontWeight: 500 }}>{o.label}</span>
                                <strong style={{ color: txt }}>{o.weight > 0 ? '+' : ''}{o.weight}</strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                        <button onClick={() => openEditQuestion(q)} style={{ ...S.btnGhost, padding: '7px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}>✏ Edit</button>
                        <button onClick={() => deleteQuestion(q._id || q.id)} style={{ ...S.btnDel, padding: '7px 16px' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ RESPONSES TAB ══ */}
        {activeTab === 'responses' && (
          <div id="admin-responses">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={S.pageTitle}>Employee Responses</h2>
                <p style={S.pageSub}>Click any row for full analysis + PDF download</p>
              </div>
              <button onClick={clearAllResponses} style={{
                padding: '8px 18px', borderRadius: '10px', border: '1px solid rgba(214,40,40,0.3)',
                background: '#fff', color: '#c62828', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>🗑 Clear All</button>
            </div>
            <div style={{ ...S.card, overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed', wordBreak: 'break-word' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e8f0e9' }}>
                    {['NAME','EMP ID','DEPARTMENT','CO₂/MONTH','EARTHS','LEVEL','DATE','ENERGY','TRANSPORT','FOOD','WASTE',''].map(h => (
                      <th key={h} style={{
                        padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
                        color: '#6c757d', letterSpacing: '0.5px', textTransform: 'uppercase',
                        background: '#f8fdf9',
                        whiteSpace: 'normal',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingResponses ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#6c757d' }}>
                      <div className="spinner" style={{ borderColor: 'rgba(45,106,79,0.2)', borderTopColor: '#2d6a4f', margin: '0 auto 8px' }}></div>
                      Loading…
                    </td></tr>
                  ) : responses.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#6c757d' }}>No responses yet.</td></tr>
                  ) : [...responses].sort((a, b) => (b as any).timestamp - (a as any).timestamp).map((r, idx) => (
                    <tr key={r._id} onClick={() => window.open(`/report/${r._id}`, '_blank')} style={{
                      borderBottom: '1px solid #f0f7f2', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fdf9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>{r.userName}</td>
                      <td style={{ padding: '16px 20px', color: '#6c757d', fontSize: '13px' }}>{r.empId}</td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6c757d' }}>{r.dept || 'N/A'}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>{r.totalCO2} kg</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>
                        {r.earths.toFixed(1)}
                        <span style={{ fontSize: '16px', marginLeft: '4px' }}>🌍</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                          background: lvlBg(r.totalCO2), color: lvlColor(r.totalCO2),
                        }}>
                          {lvlText(r.totalCO2)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '12px', color: '#6c757d' }}>
                        {r.date || new Date(r.createdAt || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>{r.catData.energy.co2} kg</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>{r.catData.transport.co2} kg</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>{r.catData.food.co2} kg</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1b4332' }}>{r.catData.waste.co2} kg</td>
                      <td style={{ padding: '16px 20px' }}>
                        <button onClick={e => { e.stopPropagation(); deleteResponse(r._id); }} style={S.btnDel}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ FORMULA TAB ══ */}
        {activeTab === 'formula' && (
          <div id="admin-formula">
            <h2 style={S.pageTitle}>Analysis Formula</h2>
            <p style={{ ...S.pageSub, marginBottom: '24px' }}>Based on IPCC / GHG Protocol emission factors from your PDF</p>

            {/* Emission Factors */}
            <div style={{ ...S.card, ...S.cardPad, marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2d6a4f', marginBottom: '4px', fontFamily: "'Playfair Display', serif" }}>Emission Factors</h3>
              <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px' }}>Customise the calculation coefficients used in scoring</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={S.label}>Electricity (kg CO₂/kWh)</label>
                  <input id="ef-electricity" type="number" step="0.01" style={S.input} value={efElectricity} onChange={e => setEfElectricity(e.target.value)} />
                  <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '6px' }}>Formula: kWh × 0.82 = kg CO₂</p>
                </div>
                <div>
                  <label style={S.label}>Transport (kg CO₂/km)</label>
                  <input id="ef-transport" type="number" step="0.01" style={S.input} value={efTransport} onChange={e => setEfTransport(e.target.value)} />
                  <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '6px' }}>Formula: km/day × 30 × 0.15</p>
                </div>
                <div>
                  <label style={S.label}>Food (kg CO₂/non-veg meal)</label>
                  <input id="ef-food" type="number" step="0.5" style={S.input} value={efFood} onChange={e => setEfFood(e.target.value)} />
                  <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '6px' }}>Formula: meals/month × 5</p>
                </div>
                <div>
                  <label style={S.label}>Sustainable Threshold (kg CO₂/month)</label>
                  <input id="ef-threshold" type="number" step="1" style={S.input} value={efThreshold} onChange={e => setEfThreshold(e.target.value)} />
                  <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '6px' }}>= 1 Earth (1.7 tonnes CO₂/year)</p>
                </div>
              </div>
              <button onClick={saveFormula} style={{ ...S.btnPrimary, marginTop: '24px' }}>Save Emission Factors</button>
            </div>

            {/* Classification Levels */}
            <div style={{ ...S.card, ...S.cardPad, marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2d6a4f', marginBottom: '16px', fontFamily: "'Playfair Display', serif" }}>Classification Levels</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { dot: '#43a047', bg: '#e8f5e9', border: '#a5d6a7', text: 'Low Impact', desc: '— < 200 kg CO₂/month (~1.4 Earths)' },
                  { dot: '#ffa000', bg: '#fff8e1', border: '#ffe082', text: 'Medium Impact', desc: '— 200–400 kg CO₂/month (1.4–2.8 Earths)' },
                  { dot: '#e53935', bg: '#ffebee', border: '#ef9a9a', text: 'High Impact', desc: '— > 400 kg CO₂/month (> 2.8 Earths)' },
                ].map(lvl => (
                  <div key={lvl.text} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 18px', borderRadius: '12px',
                    background: lvl.bg, border: `1px solid ${lvl.border}`,
                    fontSize: '14px',
                  }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: lvl.dot, flexShrink: 0, display: 'inline-block' }}></span>
                    <div><strong>{lvl.text}</strong> {lvl.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* LLM Config */}
            <div style={{ ...S.card, ...S.cardPad, borderColor: 'rgba(82,183,136,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1b4332', fontFamily: "'Playfair Display', serif" }}>LLM API Configuration</h3>
                  <p style={{ fontSize: '13px', color: '#6c757d' }}>Connect Gemini API for personalised reports</p>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={S.label}>Gemini API Key</label>
                <input type="password" id="llm-api-key" style={S.input} placeholder="AIza…" value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>System Prompt Template</label>
                <textarea id="llm-prompt" rows={10} placeholder="…" value={llmPrompt}
                  onChange={e => setLlmPrompt(e.target.value)}
                  style={{ ...S.input, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.6, color: '#333' }}
                ></textarea>
                <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '6px' }}>
                  Use {'{{'}score{'}}'}, {'{{'}totalCO2{'}}'}, {'{{'}categories{'}}'}, {'{{'}answers{'}'} as variables
                </p>
              </div>
              <button onClick={saveLLMConfig} style={{ ...S.btnPrimary, marginTop: '16px' }}>Save LLM Config</button>
            </div>
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {activeTab === 'settings' && (
          <div id="admin-settings">
            <h2 style={S.pageTitle}>Settings</h2>
            <p style={{ ...S.pageSub, marginBottom: '24px' }}>System configuration and data management</p>

            <div style={{ ...S.card, ...S.cardPad, marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1b4332', marginBottom: '16px', fontFamily: "'Playfair Display', serif" }}>Change Admin Credentials</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={S.label}>New Username</label>
                  <input id="new-admin-user" type="text" style={S.input} placeholder="New username" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>New Password</label>
                  <input id="new-admin-pass" type="password" style={S.input} placeholder="New password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} />
                </div>
              </div>
              <button onClick={changeAdminCreds} style={S.btnPrimary}>Update Credentials</button>
            </div>

            <div style={{ ...S.card, ...S.cardPad, borderColor: 'rgba(214,40,40,0.2)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#c62828', marginBottom: '4px', fontFamily: "'Playfair Display', serif" }}>Danger Zone</h3>
              <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>Irreversible — proceed with caution</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={resetQuestions} style={S.btnDangerSm}>↺ Reset to PDF Questions</button>
                <button onClick={clearAllResponses} style={S.btnDangerSm}>🗑 Clear All Responses</button>
                <button onClick={fullReset} style={{ ...S.btnDangerSm, background: 'rgba(214,40,40,0.13)' }}>⚠ Full Data Reset</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══ USER DETAIL MODAL ══ */}
      {modalOpen && viewingResponse && (
        <div
          id="modal-user"
          onClick={e => { if ((e.target as HTMLElement).id === 'modal-user') setModalOpen(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}
        >
          <div style={{
            background: '#ffffff', borderRadius: '22px',
            width: '100%', maxWidth: '620px', maxHeight: '88vh',
            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg,#2d6a4f,#52b788)',
              padding: '24px 28px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '20px', color: '#fff', fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: '4px' }}>
                    {viewingResponse.userName} — Footprint Report
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                    {viewingResponse.empId} · {viewingResponse.dept || 'N/A'} · {viewingResponse.date || new Date(viewingResponse.createdAt || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => downloadUserPDF(viewingResponse!)}
                    style={{
                      background: '#fff', color: '#2d6a4f', padding: '9px 18px',
                      fontSize: '13px', fontWeight: 600, borderRadius: '12px', border: 'none',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >📄 Download PDF</button>
                  <button
                    onClick={() => setModalOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                      width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                      fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
              {/* Score summary */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                padding: '16px 20px', background: '#f8fdf9', borderRadius: '14px',
                marginBottom: '22px', flexWrap: 'wrap',
              }}>
                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: '#2d6a4f', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{viewingResponse.earths.toFixed(1)}</div>
                  <div style={{ fontSize: '10px', color: '#6c757d', fontWeight: 700, letterSpacing: '1px', marginTop: '3px' }}>EARTHS</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', letterSpacing: '3px', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: earthIconsHTML(viewingResponse.earths) }}></div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#2d6a4f' }}>
                    {viewingResponse.totalCO2 < 200 ? 'LOW IMPACT 🟢' : viewingResponse.totalCO2 <= 400 ? 'MEDIUM IMPACT 🟡' : 'HIGH IMPACT 🔴'}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6c757d' }}>{viewingResponse.totalCO2} kg CO₂/month</div>
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1b4332', marginBottom: '14px', fontFamily: "'Playfair Display', serif" }}>Category Breakdown</h4>
                {Object.entries(viewingResponse.catData || {}).map(([cat, d]: [string, any]) => {
                  const meta = CAT_META[cat as keyof typeof CAT_META] || CAT_META.custom;
                  return (
                    <div key={cat} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1b4332' }}>{meta.icon} {meta.label.toUpperCase()}</span>
                        <span style={{ fontSize: '13px', color: meta.barColor, fontWeight: 700 }}>{d.co2} kg ({d.pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: '#e8f0e9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${d.pct}%`, background: meta.barColor, borderRadius: '999px', transition: 'width 0.5s ease' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Responses */}
              {viewingResponse.answers && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1b4332', marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>Responses</h4>
                  <div>
                    {Object.entries(viewingResponse.answers).map(([qId, ans]) => {
                      const qObj = (viewingResponse.questions || []).find(q => q.id === qId);
                      return (
                        <div key={qId} style={{ padding: '10px 0', borderBottom: '1px solid #e8f0e9' }}>
                          <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '3px' }}>{qObj ? qObj.text : qId}</div>
                          <div style={{ fontSize: '14px', color: '#2d6a4f', fontWeight: 600 }}>→ {ans}</div>
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


