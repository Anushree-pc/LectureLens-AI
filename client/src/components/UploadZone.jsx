import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  BookOpen,
  GraduationCap,
  Target,
  AlertCircle,
  FileCode,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

const SUBJECT_OPTIONS = [
  'Computer Science & Software',
  'Electrical & Electronic Engineering',
  'Mechanical & Civil Engineering',
  'Medicine, Biology & Health',
  'Physics & Natural Sciences',
  'Mathematics & Statistics',
  'Economics & Business Finance',
  'Law & Legal Studies',
  'Psychology & Social Sciences',
  'Other / Custom Subject',
];

const LEVEL_OPTIONS = [
  '1st Year Undergraduate (Introductory)',
  '2nd / 3rd Year Undergraduate (Intermediate)',
  'Final Year / Honours (Advanced)',
  'Masters / Postgraduate / PhD',
  'High School / AP / IB',
];

const FOCUS_OPTIONS = [
  {
    id: 'exam',
    label: 'High-Yield Exam Prep',
    desc: 'Emphasize definitions, formulas, problem patterns, and high-frequency exam traps.',
  },
  {
    id: 'concept',
    label: 'Deep Concept Mastery',
    desc: 'Focus on mechanisms, theoretical rationale, and conceptual relationships.',
  },
  {
    id: 'quick',
    label: 'Quick Cram & Review',
    desc: 'Concise summary bullets, key definitions, and rapid recall points.',
  },
];

export default function UploadZone({
  selectedFile,
  setSelectedFile,
  subject,
  setSubject,
  courseYear,
  setCourseYear,
  focus,
  setFocus,
  customSubject,
  setCustomSubject,
  onStartProcessing,
  onLoadSample,
  errorMessage,
  setErrorMessage,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Format file size in KB or MB
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Validate file
  const validateAndSetFile = (file) => {
    setErrorMessage('');

    if (!file) return;

    // Check size
    if (file.size === 0) {
      setErrorMessage('The selected file is empty (0 bytes). Please upload a valid lecture file.');
      return;
    }

    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSize) {
      setErrorMessage(
        `File is too large (${formatFileSize(file.size)}). The maximum allowed file size is 25MB.`
      );
      return;
    }

    // Check extension
    const nameLower = file.name.toLowerCase();
    const validExts = ['.pdf', '.docx', '.txt', '.md'];
    const isValid = validExts.some((ext) => nameLower.endsWith(ext));

    if (!isValid) {
      setErrorMessage(
        'Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt).'
      );
      return;
    }

    setSelectedFile(file);
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card card-elevated" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Error Alert */}
      {errorMessage && (
        <div className="alert alert-danger">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Step 1: Personalization Configuration */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <GraduationCap size={18} color="var(--accent-primary)" />
          Step 1: Student & Course Profile
        </h3>

        <div className="config-grid">
          {/* Subject Selection */}
          <div className="form-group">
            <label className="form-label">
              <BookOpen size={14} />
              Subject / Discipline
            </label>
            <select
              className="form-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Level */}
          <div className="form-group">
            <label className="form-label">
              <GraduationCap size={14} />
              Academic Level
            </label>
            <select
              className="form-select"
              value={courseYear}
              onChange={(e) => setCourseYear(e.target.value)}
            >
              {LEVEL_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Study Focus */}
          <div className="form-group">
            <label className="form-label">
              <Target size={14} />
              Revision Focus
            </label>
            <select
              className="form-select"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            >
              {FOCUS_OPTIONS.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Subject Write-in if 'Other' selected */}
        {subject.includes('Other') && (
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Specify Your Subject Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cognitive Neuroscience, Cryptography..."
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
            />
          </div>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1.75rem 0' }} />

      {/* Step 2: Lecture Material Upload */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <FileText size={18} color="var(--accent-primary)" />
            Step 2: Lecture Material
          </h3>

          {/* Quick Sample Loader Button */}
          <button
            type="button"
            className="sample-loader-btn"
            onClick={onLoadSample}
            title="Load sample Operating Systems lecture notes to test immediately"
          >
            <Sparkles size={14} />
            <span>Load Sample Lecture (OS Virtual Memory)</span>
          </button>
        </div>

        {/* Hidden native file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,application/pdf,text/plain"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {/* Drag & Drop Area */}
        {!selectedFile ? (
          <div
            className={`dropzone-container ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleTriggerInput}
          >
            <div className="dropzone-icon-wrap">
              <UploadCloud size={34} />
            </div>

            <div className="dropzone-title">
              Drop your lecture PDF here, or <span style={{ color: 'var(--accent-primary)' }}>browse</span>
            </div>

            <div className="dropzone-subtitle">
              Upload slide decks, lecture transcripts, study handouts, or textbook chapters
            </div>

            <div className="dropzone-file-types">
              <span>PDF (.pdf)</span>
              <span>•</span>
              <span>Word (.docx)</span>
              <span>•</span>
              <span>Text (.txt)</span>
              <span>•</span>
              <span>Max 25MB</span>
            </div>
          </div>
        ) : (
          /* File Preview Card */
          <div>
            <div className="selected-file-card">
              <div className="file-info-group">
                <div className="file-type-icon">
                  <FileCheck size={24} />
                </div>
                <div>
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-meta-row">
                    <span className="file-badge-pill">{formatFileSize(selectedFile.size)}</span>
                    <span>•</span>
                    <span>Ready for AI synthesis</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTriggerInput}
                >
                  <RefreshCw size={14} />
                  Replace
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={handleRemoveFile}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Action Row */}
        <div className="upload-action-row">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Strict grounding: The AI will generate revision notes & 5 questions <strong>strictly</strong> from your file.
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={onStartProcessing}
            disabled={!selectedFile}
            style={{ width: selectedFile ? 'auto' : '100%', minWidth: '240px' }}
          >
            <Sparkles size={18} />
            <span>Generate Notes & Practice Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}
