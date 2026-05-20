import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, User, Lock, Mail, ArrowRight, Activity, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const API_BASE = "http://localhost:8002";

export default function Auth({ onLoginSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    full_name: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // OAuth2 Password Grant requires form-data
        const params = new URLSearchParams();
        params.append('username', formData.username);
        params.append('password', formData.password);
        
        const res = await axios.post(`${API_BASE}/login`, params);
        onLoginSuccess(res.data.user, res.data.access_token);
      } else {
        await axios.post(`${API_BASE}/register`, {
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name
        });
        setIsLogin(true); // Redirect to login after successful register
        setFormData(prev => ({ ...prev, password: '' })); // Clear password
        setSuccess('Clinical ID created! You may now authorize your session.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-grid-fade" />
      
      <motion.div 
        className="hb-wrap" 
        style={{ width: '400px', margin: 'auto', flex: 'none', background: 'rgba(6, 11, 24, 0.8)', backdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="hb-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              color: 'rgba(150, 220, 255, 0.4)',
              fontSize: '11px',
              fontFamily: 'var(--font-space)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--hb-cyan)'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(150, 220, 255, 0.4)'}
          >
            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <div className="hb-logo">
            <div className="hb-logo-dot" />
            <span className="hb-logo-text">HealBot Pro · Verification</span>
          </div>
          <div style={{ width: '40px' }} /> {/* Spacer for centering */}
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className={`scenario-icon-wrap icon-a`} style={{ margin: '0 auto 16px' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 className="hb-patient-name" style={{ fontSize: '20px' }}>
              {isLogin ? 'Clinical Access' : 'Medical Enrollment'}
            </h2>
            <p className="hb-patient-meta">Secure biometric-linked protocol</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div>
                <label className="hb-section-label">Full Name</label>
                <div className="input-group">
                  <User size={14} className="input-icon" />
                  <input
                    className="hb-textarea"
                    style={{ height: '42px', paddingLeft: '36px' }}
                    type="text"
                    placeholder="Patient Name"
                    required
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="hb-section-label">Institutional ID / Username</label>
              <div className="input-group">
                <Mail size={14} className="input-icon" />
                <input
                  className="hb-textarea"
                  style={{ height: '42px', paddingLeft: '36px' }}
                  type="text"
                  placeholder="name@institution.com"
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="hb-section-label">Clinical Key / Password</label>
              <div className="input-group">
                <Lock size={14} className="input-icon" />
                <input
                  className="hb-textarea"
                  style={{ height: '42px', paddingLeft: '36px' }}
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {error && <div className="hb-stat" style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.05)', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(248, 113, 113, 0.2)', fontSize: '13px' }}>{error}</div>}
            {success && <div className="hb-stat" style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.05)', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(74, 222, 128, 0.2)', fontSize: '13px' }}>{success}</div>}

            <button className="hb-run-btn" style={{ marginTop: '10px' }} disabled={loading}>
              {loading ? 'Authenticating...' : (isLogin ? 'Authorize Access' : 'Create Clinical ID')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button 
              className="nav-link" 
              style={{ fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an ID? Enroll now" : "Already enrolled? Verify ID"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
