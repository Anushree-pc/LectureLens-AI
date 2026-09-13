import React from 'react';
import { Loader2, CheckCircle2, Circle, Sparkles, BookOpen, BrainCircuit } from 'lucide-react';

export default function ProcessingView({ currentStep, filename, onCancel }) {
  const steps = [
    {
      id: 1,
      title: 'Extracting Document Text',
      description: 'Parsing pages, text layout, and verifying readability...',
    },
    {
      id: 2,
      title: 'Analyzing Lecture Structure',
      description: 'Identifying key concepts, definitions, and core formulas...',
    },
    {
      id: 3,
      title: 'Synthesizing Revision Notes',
      description: 'Generating exam-oriented summaries and high-yield takeaways...',
    },
    {
      id: 4,
      title: 'Formulating 5-Question Quiz',
      description: 'Crafting conceptual questions with answer options and explanations...',
    },
  ];

  return (
    <div className="card card-elevated processing-container">
      {/* Animated Center Spinner */}
      <div className="processing-spinner-box">
        <div className="pulse-ring" />
        <div className="spinner-circle">
          <BrainCircuit size={36} />
        </div>
      </div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
        Analyzing Lecture Material
      </h2>

      <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Synthesizing high-yield study material from{' '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filename || 'your document'}</span>
      </p>

      {/* Pipeline Steps Tracker */}
      <div className="pipeline-steps">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;

          return (
            <div
              key={step.id}
              className={`pipeline-step-item ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
            >
              <div
                className={`step-indicator-icon ${
                  isActive ? 'active' : isCompleted ? 'completed' : 'pending'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} />
                ) : isActive ? (
                  <Loader2 size={16} />
                ) : (
                  <Circle size={14} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel Processing
        </button>
      </div>
    </div>
  );
}
