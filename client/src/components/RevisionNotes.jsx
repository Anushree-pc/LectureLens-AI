import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Copy,
  Check,
  Download,
  Printer,
  BookOpen,
  Key,
  FunctionSquare,
  ListOrdered,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

export default function RevisionNotes({ notes, metadata }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Search filter
  const query = searchQuery.trim().toLowerCase();

  const filteredConcepts = useMemo(() => {
    if (!notes?.keyConcepts) return [];
    if (!query) return notes.keyConcepts;
    return notes.keyConcepts.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
    );
  }, [notes?.keyConcepts, query]);

  const filteredDefinitions = useMemo(() => {
    if (!notes?.importantDefinitions) return [];
    if (!query) return notes.importantDefinitions;
    return notes.importantDefinitions.filter(
      (d) =>
        d.term?.toLowerCase().includes(query) ||
        d.definition?.toLowerCase().includes(query)
    );
  }, [notes?.importantDefinitions, query]);

  const filteredFormulas = useMemo(() => {
    if (!notes?.formulasOrRules) return [];
    if (!query) return notes.formulasOrRules;
    return notes.formulasOrRules.filter(
      (f) =>
        f.name?.toLowerCase().includes(query) ||
        f.formulaOrRule?.toLowerCase().includes(query) ||
        f.context?.toLowerCase().includes(query)
    );
  }, [notes?.formulasOrRules, query]);

  const filteredPoints = useMemo(() => {
    if (!notes?.keyPoints) return [];
    if (!query) return notes.keyPoints;
    return notes.keyPoints.filter((p) => p.toLowerCase().includes(query));
  }, [notes?.keyPoints, query]);

  const filteredTakeaways = useMemo(() => {
    if (!notes?.examTakeaways) return [];
    if (!query) return notes.examTakeaways;
    return notes.examTakeaways.filter((t) => t.toLowerCase().includes(query));
  }, [notes?.examTakeaways, query]);

  // Generate markdown representation of notes
  const generateMarkdown = () => {
    if (!notes) return '';
    let md = `# ${notes.topicTitle || 'Lecture Revision Notes'}\n\n`;
    if (metadata) {
      md += `**Subject:** ${metadata.subject || 'General'} | **Level:** ${metadata.courseYear || 'Undergraduate'}\n`;
      md += `**Source Document:** ${metadata.filename || 'Lecture Material'}\n\n`;
      md += `---\n\n`;
    }

    md += `## 1. Topic Overview\n\n${notes.topicOverview || ''}\n\n`;

    if (notes.keyConcepts?.length) {
      md += `## 2. Key Concepts\n\n`;
      notes.keyConcepts.forEach((c) => {
        md += `### ${c.title} [${c.importance || 'Core'}]\n${c.description}\n\n`;
      });
    }

    if (notes.importantDefinitions?.length) {
      md += `## 3. Important Definitions\n\n`;
      notes.importantDefinitions.forEach((d) => {
        md += `* **${d.term}:** ${d.definition}\n`;
      });
      md += `\n`;
    }

    if (notes.formulasOrRules?.length) {
      md += `## 4. Important Formulas & Core Rules\n\n`;
      notes.formulasOrRules.forEach((f) => {
        md += `### ${f.name}\n\`\`\`\n${f.formulaOrRule}\n\`\`\`\n*Context:* ${f.context}\n\n`;
      });
    }

    if (notes.keyPoints?.length) {
      md += `## 5. Key Points\n\n`;
      notes.keyPoints.forEach((p) => {
        md += `* ${p}\n`;
      });
      md += `\n`;
    }

    if (notes.examTakeaways?.length) {
      md += `## 6. High-Yield Exam Takeaways & Pitfalls\n\n`;
      notes.examTakeaways.forEach((t) => {
        md += `* ⚠️ **Exam Tip:** ${t}\n`;
      });
      md += `\n`;
    }

    return md;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const md = generateMarkdown();
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (notes.topicTitle || 'revision_notes')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    link.download = `${safeTitle}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Trigger print dialog for PDF export
  const handlePrint = () => {
    window.print();
  };

  if (!notes) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No revision notes generated yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Top Notes Toolbar */}
      <div className="notes-toolbar">
        {/* Search bar inside notes */}
        <div className="notes-search-box">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            className="form-input"
            placeholder="Search within notes (concepts, terms, formulas)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Export and Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCopy} title="Copy Markdown to clipboard">
            {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadMarkdown}
            title="Download formatted Markdown file"
          >
            <Download size={14} />
            <span>Download .MD</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
            title="Print or Save as PDF"
          >
            <Printer size={14} />
            <span>Export / Print PDF</span>
          </button>
        </div>
      </div>

      {/* Main Revision Notes Card */}
      <div className="card">
        {/* Title & Metadata Banner */}
        <div style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <span className="workflow-badge">Exam-Grounded Synthesis</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.4rem 0 0.75rem', lineHeight: 1.25 }}>
            {notes.topicTitle || 'Lecture Revision Notes'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {metadata?.subject && <span className="meta-pill">{metadata.subject}</span>}
            {metadata?.courseYear && <span className="meta-pill">{metadata.courseYear}</span>}
            {metadata?.filename && (
              <span className="meta-pill" style={{ fontFamily: 'var(--font-mono)' }}>
                📄 {metadata.filename}
              </span>
            )}
            {metadata?.wordCount && (
              <span className="meta-pill">
                {metadata.wordCount.toLocaleString()} words analyzed
              </span>
            )}
          </div>
        </div>

        {/* Section 1: Topic Overview */}
        {notes.topicOverview && (
          <section className="notes-section">
            <h2 className="section-header-title">
              <BookOpen size={18} />
              1. Topic Overview
            </h2>
            <div className="overview-content">{notes.topicOverview}</div>
          </section>
        )}

        {/* Section 2: Key Concepts */}
        {filteredConcepts.length > 0 && (
          <section className="notes-section">
            <h2 className="section-header-title">
              <Key size={18} />
              2. Key Concepts ({filteredConcepts.length})
            </h2>
            <div className="concept-grid">
              {filteredConcepts.map((concept, idx) => (
                <div key={idx} className="concept-card">
                  <div className="concept-card-top">
                    <h3 className="concept-card-title">{concept.title}</h3>
                    {concept.importance && (
                      <span className={`concept-importance-badge importance-${concept.importance}`}>
                        {concept.importance}
                      </span>
                    )}
                  </div>
                  <p className="concept-desc">{concept.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Important Definitions */}
        {filteredDefinitions.length > 0 && (
          <section className="notes-section">
            <h2 className="section-header-title">
              <Lightbulb size={18} />
              3. Important Definitions & Glossary ({filteredDefinitions.length})
            </h2>
            <div className="definitions-grid">
              {filteredDefinitions.map((def, idx) => (
                <div key={idx} className="definition-item">
                  <div className="definition-term">{def.term}</div>
                  <div className="definition-text">{def.definition}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Formulas & Rules */}
        {filteredFormulas.length > 0 && (
          <section className="notes-section">
            <h2 className="section-header-title">
              <FunctionSquare size={18} />
              4. Important Formulas & Core Rules ({filteredFormulas.length})
            </h2>
            <div className="formulas-grid">
              {filteredFormulas.map((f, idx) => (
                <div key={idx} className="formula-card">
                  <div className="formula-title">{f.name}</div>
                  {f.formulaOrRule && f.formulaOrRule !== 'N/A' && (
                    <div className="formula-code-box">{f.formulaOrRule}</div>
                  )}
                  {f.context && <div className="formula-context">{f.context}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Key Points */}
        {filteredPoints.length > 0 && (
          <section className="notes-section">
            <h2 className="section-header-title">
              <ListOrdered size={18} />
              5. Key Points & Essential Takeaways
            </h2>
            <ul className="points-list">
              {filteredPoints.map((point, idx) => (
                <li key={idx} className="point-item">
                  <CheckCircle2 size={16} className="point-bullet-icon" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 6: Exam-Focused Takeaways */}
        {filteredTakeaways.length > 0 && (
          <section className="notes-section" style={{ marginBottom: 0 }}>
            <h2 className="section-header-title" style={{ color: 'var(--warning-text)' }}>
              <AlertTriangle size={18} color="var(--warning)" />
              6. High-Yield Exam Takeaways & Common Traps
            </h2>
            <div className="takeaways-box">
              {filteredTakeaways.map((tip, idx) => (
                <div key={idx} className="takeaway-item">
                  <span className="takeaway-star">★</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
