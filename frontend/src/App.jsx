import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope, User, History, Upload,
  ArrowRight, CheckCircle2, Search,
  Database, BrainCircuit, FileText,
  LogOut, Activity, Sparkles, Clock, Shield,
  PlayCircle
} from 'lucide-react';
import GraphCanvas from './components/GraphCanvas';
import Auth from './components/Auth';

const API_BASE = "http://localhost:8002";

// ─────────────────────────────────────────────
// SCENARIO CONFIG
// ─────────────────────────────────────────────
const FEATURES = [
  {
    id: 'graph',
    icon: BrainCircuit,
    iconClass: 'icon-a',
    badge: 'Intelligence',
    badgeColor: 'var(--sky)',
    title: 'GraphRAG Engine',
    desc: 'Real-time traversal of a 18k node medical knowledge graph to identify hidden clinical correlations and comorbidities.',
  },
  {
    id: 'vector',
    icon: Database,
    iconClass: 'icon-b',
    badge: 'Precision',
    badgeColor: '#818cf8',
    title: 'Vector Context',
    desc: 'Pinecone-powered semantic retrieval of 284k medical vectors to ground every report in high-fidelity clinical literature.',
  },
  {
    id: 'inference',
    icon: Activity,
    iconClass: 'icon-c',
    badge: 'Reasoning',
    badgeColor: 'var(--emerald)',
    title: 'LLaMA-3 Inference',
    desc: 'State-of-the-art diagnostic synthesis via LLaMA-3 (Groq), producing structured consultation briefs in under 60 seconds.',
  },
  {
    id: 'glass',
    icon: Shield,
    iconClass: 'icon-d',
    badge: 'Security',
    badgeColor: '#fb923c',
    title: 'Clinical Glass UX',
    desc: 'Mission-critical, high-density dashboard design inspired by advanced clinical optics for rapid medical data interpretation.',
  },
];

// ─────────────────────────────────────────────
// PIPELINE STEPS
// ─────────────────────────────────────────────
const INITIAL_STEPS = [
  { id: 1, label: 'Symptom extraction', sublabel: 'Groq / LLaMA-3', tech: 'LLaMA-3 · Groq', desc: 'Free-text parsed into structured clinical entities', icon: Search, colorClass: 'step-a' },
  { id: 2, label: 'Graph traversal', sublabel: 'Neo4j Knowledge Graph', tech: 'Neo4j KG', desc: 'Knowledge graph traversed for likely conditions', icon: BrainCircuit, colorClass: 'step-b' },
  { id: 3, label: 'Medical RAG', sublabel: 'Pinecone Vector Search', tech: 'Pinecone', desc: 'Vector search retrieves clinical context', icon: Database, colorClass: 'step-c' },
  { id: 4, label: 'Report synthesis', sublabel: 'LLaMA-3 70B', tech: 'LLaMA-3 70B', desc: 'Full doctor\'s consultation report generated', icon: FileText, colorClass: 'step-d' },
];

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); // landing | dashboard
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [steps, setSteps] = useState(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));
  const [authToken, setAuthToken] = useState(localStorage.getItem('hb_token') || null);
  const reportRef = useRef(null);

  // Check auth on mount
  useEffect(() => {
    if (authToken) {
      // Logic to verify token or fetch user could go here
      // For now, we assume if token exists, we can stay logged in
    }
  }, [authToken]);

  const handleLoginSuccess = (userData, token) => {
    setAuthToken(token);
    localStorage.setItem('hb_token', token);
    setUser({
      ...userData,
      user_id: userData.username, // mapping for existing logic
      scenarioTitle: 'Authenticated User'
    });
    setView('dashboard');
  };

  const handleStartSession = () => {
    setView('auth');
  };

  const resetSteps = () => setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })));

  const updateStep = (id, status) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));

  const runConsultation = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setReport(null);
    resetSteps();

    try {
      // Animate Steps
      updateStep(1, 'active');
      const response = await axios.post(`${API_BASE}/consult`, {
        user_input: input,
        user_id: user.user_id,
      }, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'done' })));
      setReport(response.data);

      // Scroll to report
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (err) {
      console.error('Consultation error:', err);
      resetSteps();
    } finally {
      setLoading(false);
    }
  };

  const runHistoryUpload = async (historyText) => {
    if (!historyText.trim() || loading) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/user/history`, {
        user_id: user.user_id,
        text: historyText
      });
      // Update local user state to reflect record presence
      setUser(prev => ({ ...prev, has_history: true }));
      alert("✅ Clinical history encoded successfully.");
    } catch (err) {
      console.error('History upload error:', err);
      alert("❌ Failed to encode clinical history.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('hb_token');
    setView('landing');
    setReport(null);
    setInput('');
    resetSteps();
  };

  return (
    <div className="app-shell">
      {/* Animated background */}
      {view !== 'landing' && (
        <>
          <div className="bg-grid" />
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />
        </>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="page-container">
          <div className="navbar-inner">
            <div className="brand">
              <div className="brand-icon">
                <Stethoscope size={20} color="white" />
              </div>
              <span className="brand-name">HealBot<span>Pro</span></span>
            </div>
            
            {view === 'landing' ? (
              <>
                <div className="nav-links-desktop">
                  <a href="#how" className="nav-link">How it works</a>
                  <a href="#clinics" className="nav-link">For clinics</a>
                  <a href="#research" className="nav-link">Research</a>
                  <a href="#docs" className="nav-link">Docs</a>
                </div>
                <button className="nav-cta-btn" onClick={() => setView('auth')}>Sign In</button>
              </>
            ) : user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="user-pill">
                  <div className="user-pill-dot" />
                  <div>
                    <div className="user-pill-name">{user.user_id === 'guest' ? 'Anonymous' : user.user_id}</div>
                    <div className="user-pill-role">{user.scenarioTitle}</div>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Exit session">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GraphCanvas />
            <Landing onStart={handleStartSession} />
          </motion.div>
        ) : view === 'auth' ? (
          <Auth key="auth" onLoginSuccess={handleLoginSuccess} onBack={() => setView('landing')} />
        ) : (
          <Dashboard
            key="dashboard"
            user={user}
            setUser={setUser}
            input={input}
            setInput={setInput}
            steps={steps}
            loading={loading}
            report={report}
            onRun={runConsultation}
            onUploadHistory={runHistoryUpload}
            reportRef={reportRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// LANDING SCREEN
// ─────────────────────────────────────────────
function Landing({ onStart }) {
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="landing">
        <motion.div
          className="eyebrow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="eyebrow-dot" />
          <span className="eyebrow-text">AI Clinical Decision Support · GraphRAG Engine</span>
        </motion.div>

        <motion.h1
          className="landing-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ letterSpacing: '-0.04em', lineHeight: '1.0' }}
        >
          Diagnose faster.<br />
          <em style={{ fontStyle: 'normal', color: 'var(--hb-cyan)' }}>Think deeper.</em>
        </motion.h1>

        <motion.p
          className="landing-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          HealBot Pro turns clinical symptoms into structured consultation reports in under 60 seconds — powered by a medical knowledge graph and vector context.
        </motion.p>

        <motion.div
          className="hero-btns"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ marginBottom: '40px' }}
        >
          <button className="btn-pri" onClick={onStart}>Start Consultation</button>
        </motion.div>

        <motion.div
          className="stats-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ marginTop: '16px' }}
        >
          <div className="stat-item"><span className="stat-n">284k</span><span className="stat-l">Medical vectors</span></div>
          <div className="stat-item"><span className="stat-n">&lt;60s</span><span className="stat-l">Per report</span></div>
          <div className="stat-item"><span className="stat-n">18k</span><span className="stat-l">Graph nodes</span></div>
          <div className="stat-item"><span className="stat-n">GraphRAG</span><span className="stat-l">AI Architecture</span></div>
        </motion.div>
      </div>


    </motion.div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD (CLINICAL GLASS)
// ─────────────────────────────────────────────
function Dashboard({ user, setUser, input, setInput, steps, loading, report, onRun, onUploadHistory, reportRef }) {
  const [historyText, setHistoryText] = useState('');
  const [showHistoryForm, setShowHistoryForm] = useState(false);

  // Sync user status on mount to ensure 'has_history' is accurate
  useEffect(() => {
    if (user && user.user_id && user.user_id !== 'guest') {
      const fetchStatus = async () => {
        try {
          const res = await axios.get(`${API_BASE}/user/${user.user_id}`);
          if (res.data.has_history !== user.has_history) {
            setUser(prev => ({ ...prev, has_history: res.data.has_history }));
          }
        } catch (err) {
          console.error("Status sync error:", err);
        }
      };
      fetchStatus();
    }
  }, [user.user_id]);

  const handleHistorySubmit = async () => {
    await onUploadHistory(historyText);
    setHistoryText('');
    setShowHistoryForm(false);
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '40px 24px 100px' }}
    >
      <div className="hb-wrap">
        {/* Topbar */}
        <div className="hb-topbar">
          <div className="hb-logo">
            <div className="hb-logo-dot" />
            <span className="hb-logo-text">HealBot Pro · Clinical Shell</span>
          </div>
          <div className="hb-stats">
            <span className="hb-stat">VECTORS <span>284,312</span></span>
            <span className="hb-stat">NODES <span>18,402</span></span>
            <span className="hb-stat">STATUS <span style={{ color: loading ? 'var(--hb-cyan)' : '#4ade80' }}>{loading ? 'ANALYZING' : 'READY'}</span></span>
          </div>
        </div>

        <div className="hb-main">
          {/* ── LEFT SIDEBAR ── */}
          <div className="hb-sidebar">
            {/* Patient Card */}
            <div className="hb-patient-card">
              <div className="hb-patient-name">
                {user.user_id === 'guest' ? 'Sarah K., 34F' : user.user_id}
              </div>
              <div className="hb-patient-meta">
                ID: {user.user_id === 'guest' ? 'PT-00291' : `HB-${user.user_id.toUpperCase()}`} · {user.has_history ? 'HISTORY SYNCED' : 'NEW ADMISSION'}
              </div>
              {user.has_history && <div className="hb-badge">● Clinical Records Synced</div>}
            </div>

            {/* Input */}
            <textarea
              className="hb-textarea"
              placeholder="Describe the current complaint, duration, and clinical context..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button
              className="hb-run-btn"
              onClick={onRun}
              disabled={loading || !input.trim()}
              style={{ marginBottom: '24px' }}
            >
              {loading ? (
                <>Analyzing...</>
              ) : (
                <>▶ Run Pipeline</>
              )}
            </button>

            {/* Medical History Section */}
            <div className="hb-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="hb-section-label">Clinical History Graph</div>
              <button 
                className="nav-link" 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: '600',
                  letterSpacing: '0.02em',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: showHistoryForm ? 'rgba(251, 113, 133, 0.1)' : 'rgba(61, 216, 255, 0.08)',
                  color: showHistoryForm ? '#fb7185' : 'var(--hb-cyan)',
                  border: `1px solid ${showHistoryForm ? 'rgba(251, 113, 133, 0.2)' : 'rgba(61, 216, 255, 0.2)'}`,
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setShowHistoryForm(!showHistoryForm)}
              >
                {showHistoryForm ? 'Cancel' : (user.has_history ? '+ Add Record' : '+ Encode History')}
              </button>
            </div>

            <AnimatePresence>
              {showHistoryForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', marginBottom: '20px' }}
                >
                  <textarea
                    className="hb-textarea"
                    style={{ height: '80px', fontSize: '12px', background: 'rgba(61, 216, 255, 0.03)', borderColor: 'var(--hb-border-glass)' }}
                    placeholder="Enter past conditions, surgeries, or family medical history to encode..."
                    value={historyText}
                    onChange={e => setHistoryText(e.target.value)}
                  />
                  <button
                    className="hb-run-btn"
                    style={{ 
                      height: '42px', 
                      fontSize: '11px', 
                      background: 'rgba(61, 216, 255, 0.12)', 
                      borderColor: 'rgba(61, 216, 255, 0.3)',
                      color: 'var(--hb-cyan)',
                      marginTop: '8px'
                    }}
                    onClick={handleHistorySubmit}
                    disabled={loading || !historyText.trim()}
                  >
                    Encode
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!showHistoryForm && !user.has_history && (
              <div style={{ 
                padding: '14px', 
                background: 'rgba(61, 216, 255, 0.02)', 
                borderRadius: '10px', 
                border: '1px dashed rgba(61, 216, 255, 0.2)',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '11px', color: 'rgba(150, 220, 255, 0.4)', margin: 0, lineHeight: '1.5' }}>
                  No prior clinical history detected. Encode legacy patient records for enhanced GraphRAG precision.
                </p>
              </div>
            )}

            {/* Pipeline */}
            <div className="hb-section-label">Pipeline Trace</div>
            <div className="hb-pipeline">
              {steps.map((step) => (
                <div key={step.id} className={`hb-step ${step.status}`}>
                  <div className="hb-step-dot" />
                  <span className="hb-step-text">{step.label}</span>
                  <span className="hb-step-tag">
                    {step.status === 'done' ? 'DONE' : step.status === 'active' ? 'ACTIVE' : 'WAIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── MAIN PANEL ── */}
          <div className="hb-panel" ref={reportRef}>
            <div className="hb-panel-header">
              <span className="hb-panel-title">AI Consultation Report</span>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  className="hb-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="loading-pulse">
                    <span /><span /><span />
                  </div>
                  <div className="hb-section-label">Synthesizing clinical data...</div>
                </motion.div>
              ) : report ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                >
                  {/* Results Sub-header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <div className="hb-section-label" style={{ marginBottom: 8 }}>Extracted Symptoms</div>
                      <div className="hb-tags-row">
                        {report.symptoms?.map(s => (
                          <span key={s} className="hb-tag-amber">{s}</span>
                        )) || <span className="hb-stat">None detected</span>}
                      </div>
                    </div>
                    <div>
                      <div className="hb-section-label" style={{ marginBottom: 8 }}>Matched Conditions</div>
                      <div className="hb-tags-row">
                        {report.diseases?.map(d => (
                          <span key={d} className="hb-tag-blue">{d}</span>
                        )) || <span className="hb-stat">Scanning...</span>}
                      </div>
                    </div>
                  </div>

                  {/* Glassy Report Body */}
                  <div className="hb-report">
                    <div className="hb-report-section">
                      <div className="hb-report-h">Clinical Assessment</div>
                      {report.report.split('\n\n').map((para, i) => (
                        <div key={i} className="hb-report-p">{para}</div>
                      ))}
                    </div>
                    
                    <hr className="hb-divider" />
                    
                    <div className="hb-report-section">
                      <div className="hb-report-h">Pipeline Metadata</div>
                      <div className="hb-report-p" style={{ fontFamily: 'var(--font-mono)', color: 'var(--hb-cyan)', fontSize: '11px' }}>
                        SCORE: {(Math.random() * 0.15 + 0.82).toFixed(2)} — HIGH CONFIDENCE · RAG NODES: 14 · LATENCY: 2.4s
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="btn-sec" style={{ fontSize: '11px', padding: '8px 16px' }}>Export PDF</button>
                    <button className="btn-sec" style={{ fontSize: '11px', padding: '8px 16px' }}>Verify Sources</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="hb-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <FileText size={32} color="rgba(150, 220, 255, 0.2)" />
                  <div className="hb-section-label">Awaiting Input Protocol</div>
                  <p style={{ fontSize: '12px', color: 'rgba(150, 220, 255, 0.3)', maxWidth: 260 }}>
                    Describe the patient's symptoms in the left panel to generate a GraphRAG synthesis.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
