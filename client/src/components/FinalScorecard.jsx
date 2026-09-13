import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  BookOpen,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
} from 'lucide-react';

export default function FinalScorecard({
  score,
  totalQuestions = 5,
  userAnswers,
  onRetakeQuiz,
  onSwitchToNotes,
  topicTitle,
}) {
  const percentage = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    // Launch celebratory confetti for good score
    if (score >= 3) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti optional
      }
    }
  }, [score]);

  // Performance assessment
  const getAssessment = () => {
    if (percentage === 100) {
      return {
        title: 'Outstanding Mastery! 🌟',
        desc: 'You answered every question correctly. Your conceptual understanding of the lecture is exceptional.',
        badge: 'High Distinction',
      };
    } else if (percentage >= 80) {
      return {
        title: 'Great Comprehension! 👏',
        desc: 'Strong grasp of core definitions and mechanisms. Review the minor missed concepts below.',
        badge: 'Proficient',
      };
    } else if (percentage >= 60) {
      return {
        title: 'Good Foundation! 💡',
        desc: 'You have a working knowledge of the topics. Strengthen your understanding with another pass of the revision notes.',
        badge: 'Satisfactory',
      };
    } else {
      return {
        title: 'Revision Needed 📖',
        desc: 'Some key lecture mechanisms need reinforcement. Read through the explanations below and revisit the revision notes.',
        badge: 'Needs Review',
      };
    }
  };

  const assessment = getAssessment();

  // Export Quiz with Answer Key as Markdown
  const handleDownloadQuizMd = () => {
    let md = `# Practice Quiz & Answer Key: ${topicTitle || 'Lecture Material'}\n\n`;
    md += `**Score:** ${score} / ${totalQuestions} (${percentage}%)\n\n`;
    md += `---\n\n`;

    userAnswers.forEach((ans, idx) => {
      const letters = ['A', 'B', 'C', 'D'];
      md += `### Question ${idx + 1}: ${ans.question}\n\n`;
      ans.options.forEach((opt, oIdx) => {
        const isSelected = ans.selectedIndex === oIdx;
        const isCorrect = ans.correctAnswerIndex === oIdx;
        let prefix = `[ ]`;
        if (isSelected && isCorrect) prefix = `[x] (Your Correct Answer)`;
        else if (isSelected && !isCorrect) prefix = `[x] (Your Answer - Incorrect)`;
        else if (isCorrect) prefix = `[ ] (Correct Answer)`;

        md += `${letters[oIdx]}. ${prefix} ${opt}\n`;
      });
      md += `\n**Explanation:** ${ans.explanation}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz_results_${topicTitle ? topicTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() : 'lecture'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="quiz-wrapper">
      {/* Hero Score Box */}
      <div className="scorecard-hero">
        <div className="score-badge-circle">
          <div className="score-number">{score}</div>
          <div className="score-total">out of {totalQuestions}</div>
        </div>

        <div className="workflow-badge" style={{ marginBottom: '0.75rem' }}>
          <Award size={14} />
          {assessment.badge} • {percentage}% Score
        </div>

        <h2 className="scorecard-title">{assessment.title}</h2>
        <p className="scorecard-subtitle">{assessment.desc}</p>

        {/* Action Buttons */}
        <div className="scorecard-cta-group">
          <button className="btn btn-primary" onClick={onRetakeQuiz}>
            <RotateCcw size={16} />
            Retake Quiz
          </button>

          <button className="btn btn-secondary" onClick={onSwitchToNotes}>
            <BookOpen size={16} />
            Review Notes
          </button>

          <button className="btn btn-outline" onClick={handleDownloadQuizMd}>
            <Download size={16} />
            Export Quiz & Answers (.MD)
          </button>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div>
        <h3 className="review-section-title">Question-by-Question Breakdown</h3>

        {userAnswers.map((item, idx) => {
          const isCorrect = item.isCorrect;
          const userSelectedLetter =
            item.selectedIndex !== null ? ['A', 'B', 'C', 'D'][item.selectedIndex] : 'None';
          const correctLetter = ['A', 'B', 'C', 'D'][item.correctAnswerIndex];

          return (
            <div key={idx} className="review-card">
              <div className="review-card-header">
                <span className="question-tag">Question {idx + 1} of {totalQuestions}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    color: isCorrect ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 size={16} />
                      Correct (+1)
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Incorrect (0)
                    </>
                  )}
                </span>
              </div>

              <div className="review-question-title">{item.question}</div>

              {/* Answers Comparison */}
              <div className="review-answer-row">
                <div
                  className={`user-answer-line ${
                    isCorrect ? 'was-correct' : 'was-incorrect'
                  }`}
                >
                  <strong>Your Answer ({userSelectedLetter}):</strong>{' '}
                  {item.selectedIndex !== null ? item.options[item.selectedIndex] : 'Not answered'}
                </div>

                {!isCorrect && (
                  <div className="correct-answer-line">
                    <strong>Correct Answer ({correctLetter}):</strong>{' '}
                    {item.options[item.correctAnswerIndex]}
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <strong>Pedagogical Explanation:</strong> {item.explanation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
