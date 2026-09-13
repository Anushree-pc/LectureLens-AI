import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, ExternalLink, X, ShieldCheck } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, userApiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(userApiKey || '');
  const [hasEnvKey, setHasEnvKey] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    setKeyInput(userApiKey || '');
  }, [userApiKey]);

  useEffect(() => {
    if (isOpen) {
      checkServerHealth();
    }
  }, [isOpen]);

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerOnline(true);
        setHasEnvKey(Boolean(data.hasEnvApiKey));
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveApiKey('');
    setTestResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <Key size={20} className="text-accent" />
            AI API Configuration
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            This application uses <strong>OpenAI (GPT-4o-mini)</strong> for zero-hallucination revision notes and quiz generation.
          </p>

          {/* Backend Status Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="var(--accent-primary)" />
              <span>Backend Server Status:</span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600,
                color: serverOnline ? 'var(--success)' : 'var(--danger)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: serverOnline ? 'var(--success)' : 'var(--danger)',
                }}
              />
              {serverOnline ? (hasEnvKey ? 'Connected (OPENAI_API_KEY Active)' : 'Connected (Key Required)') : 'Offline'}
            </span>
          </div>

          {hasEnvKey && !userApiKey && (
            <div className="alert alert-success" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                An <code>OPENAI_API_KEY</code> is configured on the backend server in <code>server/.env</code>. All AI requests are executed securely on the server without exposing keys.
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">
              OpenAI API Key (Session Override)
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="sk-proj-..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoComplete="off"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              For permanent configuration, place your key in <code>server/.env</code> as <code>OPENAI_API_KEY=sk-...</code>.
            </span>
          </div>

          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-primary)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              <span>Where to find your OpenAI API Key:</span>
            </div>
            <div>
              Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
              >
                OpenAI Platform <ExternalLink size={12} />
              </a>
              . Add it to <code>server/.env</code> as <code>OPENAI_API_KEY=...</code>.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {userApiKey && (
            <button className="btn btn-outline btn-sm" onClick={handleClear}>
              Clear Key
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
