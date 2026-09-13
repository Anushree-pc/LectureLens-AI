import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sun,
  Moon,
  Key,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  Layers,
} from 'lucide-react';

import UploadZone from './components/UploadZone';
import ProcessingView from './components/ProcessingView';
import RevisionNotes from './components/RevisionNotes';
import QuizExperience from './components/QuizExperience';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  // Theme state: dark mode by default
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('studiva_theme') || 'dark';
  });

  // API Key state: stored in sessionStorage for security
  const [userApiKey, setUserApiKey] = useState(() => {
    return sessionStorage.getItem('studiva_api_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasServerEnvKey, setHasServerEnvKey] = useState(false);

  // Application Stage: 'upload' | 'processing' | 'workspace'
  const [activeStage, setActiveStage] = useState(() => {
    return sessionStorage.getItem('studiva_stage') || 'upload';
  });

  // Workspace active tab: 'notes' | 'quiz'
  const [activeTab, setActiveTab] = useState('notes');

  // Student personalization configuration
  const [subject, setSubject] = useState('Computer Science & Software');
  const [customSubject, setCustomSubject] = useState('');
  const [courseYear, setCourseYear] = useState('2nd / 3rd Year Undergraduate (Intermediate)');
  const [focus, setFocus] = useState('High-Yield Exam Prep');

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Processing visualizer state
  const [processingStep, setProcessingStep] = useState(1);

  // Generated results
  const [revisionNotes, setRevisionNotes] = useState(() => {
    const saved = sessionStorage.getItem('studiva_notes');
    return saved ? JSON.parse(saved) : null;
  });

  const [quiz, setQuiz] = useState(() => {
    const saved = sessionStorage.getItem('studiva_quiz');
    return saved ? JSON.parse(saved) : [];
  });

  const [metadata, setMetadata] = useState(() => {
    const saved = sessionStorage.getItem('studiva_meta');
    return saved ? JSON.parse(saved) : null;
  });

  // Update theme on HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studiva_theme', theme);
  }, [theme]);

  // Check server health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasEnvApiKey) {
          setHasServerEnvKey(true);
        }
      })
      .catch((err) => console.log('Server health check notice:', err.message));
  }, []);

  // Save session state
  useEffect(() => {
    if (revisionNotes && quiz?.length > 0) {
      sessionStorage.setItem('studiva_notes', JSON.stringify(revisionNotes));
      sessionStorage.setItem('studiva_quiz', JSON.stringify(quiz));
      sessionStorage.setItem('studiva_meta', JSON.stringify(metadata));
      sessionStorage.setItem('studiva_stage', activeStage);
    }
  }, [revisionNotes, quiz, metadata, activeStage]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSaveApiKey = (key) => {
    setUserApiKey(key);
    sessionStorage.setItem('studiva_api_key', key);
  };

  // Reset workspace
  const handleResetSession = () => {
    if (
      activeStage === 'workspace' &&
      !window.confirm('Start a new session? Your current revision notes and quiz will be cleared.')
    ) {
      return;
    }
    setActiveStage('upload');
    setActiveTab('notes');
    setSelectedFile(null);
    setRevisionNotes(null);
    setQuiz([]);
    setMetadata(null);
    setErrorMessage('');
    sessionStorage.removeItem('studiva_notes');
    sessionStorage.removeItem('studiva_quiz');
    sessionStorage.removeItem('studiva_meta');
    sessionStorage.removeItem('studiva_stage');
  };

  // One-click Sample Loader: fetches the real sample PDF and populates state
  const handleLoadSample = async () => {
    setErrorMessage('');
    try {
      const res = await fetch('/sample_lecture.pdf');
      if (!res.ok) throw new Error('Sample PDF file not found in public folder.');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'CS301_Virtual_Memory_Lecture.pdf', {
        type: 'application/pdf',
      });
      setSelectedFile(sampleFile);
      setSubject('Computer Science & Software');
      setCourseYear('2nd / 3rd Year Undergraduate (Intermediate)');
      setFocus('High-Yield Exam Prep');
    } catch (err) {
      setErrorMessage(`Failed to load sample lecture: ${err.message}`);
    }
  };

  // Main Processing Handler
  const handleStartProcessing = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or upload a lecture file to proceed.');
      return;
    }

    setErrorMessage('');
    setActiveStage('processing');
    setProcessingStep(1);

    const activeSubject = subject.includes('Other') && customSubject.trim()
      ? customSubject.trim()
      : subject;

    try {
      // Step 1: Extract document text
      const formData = new FormData();
      formData.append('file', selectedFile);

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const extractData = await extractRes.json();

      if (!extractRes.ok || !extractData.success) {
        throw new Error(extractData.message || 'Failed to extract text from lecture file.');
      }

      const extractedText = extractData.extractedText;
      const fileStats = extractData.stats;

      // Step 2 & 3: AI analysis and notes synthesis
      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStep(3);

      const headers = { 'Content-Type': 'application/json' };
      if (userApiKey) {
        headers['x-openai-api-key'] = userApiKey;
        headers['x-api-key'] = userApiKey;
      }

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: extractedText,
          subject: activeSubject,
          courseYear,
          focus,
        }),
      });

      const genData = await generateRes.json();

      if (!generateRes.ok || !genData.success) {
        if (genData.error === 'NO_API_KEY') {
          // If no API key configured, present friendly modal and fallback option
          setActiveStage('upload');
          setIsApiKeyModalOpen(true);
          setErrorMessage(
            'An OpenAI API key is required. Please add your OPENAI_API_KEY to server/.env or enter it in the API Settings modal.'
          );
          return;
        }
        throw new Error(genData.message || 'AI Generation encountered an error.');
      }

      // Step 4: Validate 5 quiz questions
      setProcessingStep(4);
      await new Promise((r) => setTimeout(r, 600));

      const finalMeta = {
        title: genData.revisionNotes?.topicTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
        subject: activeSubject,
        courseYear,
        focus,
        filename: selectedFile.name,
        wordCount: fileStats.wordCount,
        charCount: fileStats.charCount,
        pageCount: fileStats.pageCount,
      };

      setRevisionNotes(genData.revisionNotes);
      setQuiz(genData.quiz);
      setMetadata(finalMeta);
      setActiveStage('workspace');
      setActiveTab('notes');
    } catch (err) {
      console.error('Processing error:', err);
      setActiveStage('upload');
      setErrorMessage(err.message || 'An error occurred while processing your lecture material.');
    }
  };

  // Direct Sample Demo Loader (for testing full experience without needing immediate API key)
  const handleLoadDemoWorkspace = async () => {
    try {
      setActiveStage('processing');
      setProcessingStep(1);
      await new Promise((r) => setTimeout(r, 400));
      setProcessingStep(2);
      await new Promise((r) => setTimeout(r, 500));
      setProcessingStep(3);

      const res = await fetch('/api/sample-demo');
      const data = await res.json();

      setProcessingStep(4);
      await new Promise((r) => setTimeout(r, 500));

      if (data.success) {
        setRevisionNotes(data.revisionNotes);
        setQuiz(data.quiz);
        setMetadata(data.metadata);
        setActiveStage('workspace');
        setActiveTab('notes');
      }
    } catch (err) {
      setActiveStage('upload');
      setErrorMessage(`Failed to load demo workspace: ${err.message}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header */}
      <header className="app-header">
        <div className="container header-inner">
          {/* Branding Logo */}
          <div className="logo-group" onClick={() => activeStage === 'workspace' && setActiveTab('notes')}>
            <div className="logo-badge">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="logo-text-title">LectureLens AI</div>
              <div className="logo-text-subtitle">Lecture Revision & Practice Quiz</div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="header-actions">
            {/* Quick Demo Workspace Shortcut button */}
            {activeStage === 'upload' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleLoadDemoWorkspace}
                title="Instant zero-wait demo with real Operating Systems lecture"
              >
                <Sparkles size={14} />
                <span>Explore Demo Workspace</span>
              </button>
            )}

            {/* API Key Modal Button */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsApiKeyModalOpen(true)}
              title="Configure Google Gemini API Key"
            >
              <Key size={14} color={userApiKey || hasServerEnvKey ? 'var(--success)' : 'var(--warning)'} />
              <span>
                {userApiKey || hasServerEnvKey ? 'API Key Active' : 'Configure API Key'}
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Reset Session Button (Visible when on workspace or processing) */}
            {activeStage !== 'upload' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetSession}
                title="Upload new lecture document"
              >
                <RotateCcw size={14} />
                <span>New Upload</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem 0 3.5rem' }}>
        <div className="container">
          {/* STAGE 1: UPLOAD & CONFIGURATION */}
          {activeStage === 'upload' && (
            <div>
              {/* Hero Banner */}
              <section className="hero-section">
                <div className="workflow-badge">
                  <Sparkles size={13} />
                  Focused Student Workflow
                </div>
                <h1 className="hero-title">
                  Turn Any Lecture Into <span className="hero-highlight">Revision Notes</span> &{' '}
                  <span className="hero-highlight">Practice Quiz</span>
                </h1>
                <p className="hero-desc">
                  Upload your lecture slides, readings, or notes. Receive exam-oriented revision summaries
                  and exactly 5 practice questions strictly grounded in your material.
                </p>
              </section>

              {/* Upload & Personalization Component */}
              <UploadZone
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                subject={subject}
                setSubject={setSubject}
                courseYear={courseYear}
                setCourseYear={setCourseYear}
                focus={focus}
                setFocus={setFocus}
                customSubject={customSubject}
                setCustomSubject={setCustomSubject}
                onStartProcessing={handleStartProcessing}
                onLoadSample={handleLoadSample}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
              />
            </div>
          )}

          {/* STAGE 2: PROCESSING ANIMATION */}
          {activeStage === 'processing' && (
            <ProcessingView
              currentStep={processingStep}
              filename={selectedFile?.name || metadata?.filename}
              onCancel={() => setActiveStage('upload')}
            />
          )}

          {/* STAGE 3: RESULTS WORKSPACE (NOTES & QUIZ TABS) */}
          {activeStage === 'workspace' && (
            <div>
              {/* Top Bar with Tabs and Metadata */}
              <div className="workspace-top-bar">
                <div className="workspace-title-box">
                  <h2>{metadata?.title || 'Lecture Revision Workspace'}</h2>
                  <div className="workspace-meta-tags">
                    <span className="meta-pill">{metadata?.subject}</span>
                    <span className="meta-pill">{metadata?.courseYear}</span>
                    <span className="meta-pill">{metadata?.focus}</span>
                    <span className="meta-pill" style={{ fontFamily: 'var(--font-mono)' }}>
                      5 Quiz Questions
                    </span>
                  </div>
                </div>

                {/* Tab Navigator */}
                <div className="tab-nav-container">
                  <button
                    className={`tab-nav-btn ${activeTab === 'notes' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('notes')}
                  >
                    <BookOpen size={16} />
                    <span>Revision Notes</span>
                  </button>

                  <button
                    className={`tab-nav-btn ${activeTab === 'quiz' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                  >
                    <HelpCircle size={16} />
                    <span>Practice Quiz</span>
                    <span className="tab-badge">5 Qs</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Revision Notes */}
              {activeTab === 'notes' && (
                <RevisionNotes notes={revisionNotes} metadata={metadata} />
              )}

              {/* Tab 2: Interactive Quiz Experience */}
              {activeTab === 'quiz' && (
                <QuizExperience
                  quiz={quiz}
                  topicTitle={metadata?.title}
                  onSwitchToNotes={() => setActiveTab('notes')}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem 0',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="container">
          <p>
            <strong>LectureLens AI</strong> • AI-Powered Student Workspace • Lecture Material → Revision Notes + Practice Quiz
          </p>
        </div>
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        userApiKey={userApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
