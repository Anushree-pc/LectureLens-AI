import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Award,
} from 'lucide-react';
import FinalScorecard from './FinalScorecard';

export default function QuizExperience({ quiz = [], topicTitle = '', onSwitchToNotes }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  // Guarantee 5 questions
  const totalQuestions = quiz.length || 5;
  const currentQuestion = quiz[currentIndex];

  // Calculate current score from userAnswers
  const score = userAnswers.filter((a) => a.isCorrect).length;

  const handleSelectOption = (idx) => {
    if (isSubmitted) return; // Locked after submitting
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    setIsSubmitted(true);

    const answerRecord = {
      questionId: currentQuestion.questionId || currentIndex + 1,
      question: currentQuestion.question,
      options: currentQuestion.options,
      selectedIndex: selectedOption,
      correctAnswerIndex: currentQuestion.correctAnswerIndex,
      isCorrect,
      explanation: currentQuestion.explanation,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setUserAnswers([]);
    setIsFinished(false);
  };

  if (!quiz || quiz.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No practice quiz questions available.</p>
      </div>
    );
  }

  // If quiz is finished, show Final Scorecard
  if (isFinished) {
    return (
      <FinalScorecard
        score={score}
        totalQuestions={totalQuestions}
        userAnswers={userAnswers}
        onRetakeQuiz={handleRetakeQuiz}
        onSwitchToNotes={onSwitchToNotes}
        topicTitle={topicTitle}
      />
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];
  const progressPercent = ((currentIndex + (isSubmitted ? 1 : 0)) / totalQuestions) * 100;

  return (
    <div className="quiz-wrapper">
      {/* Progress & Score Bar */}
      <div className="quiz-progress-bar-container">
        <div className="quiz-progress-meta">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>
            Score: {score} / {userAnswers.length} answered
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="question-card">
        <div className="question-header-row">
          <span className="question-tag">
            Concept Check #{currentIndex + 1}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Strictly derived from lecture
          </span>
        </div>

        {/* Question Text */}
        <h2 className="question-text">{currentQuestion.question}</h2>

        {/* Options List */}
        <div className="options-grid">
          {currentQuestion.options.map((optionText, idx) => {
            let optionClass = 'option-btn';
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = currentQuestion.correctAnswerIndex === idx;

            if (isSubmitted) {
              if (isCorrectAnswer) {
                optionClass += ' is-correct';
              } else if (isSelected && !isCorrectAnswer) {
                optionClass += ' is-incorrect';
              }
            } else if (isSelected) {
              optionClass += ' selected-neutral';
            }

            return (
              <button
                key={idx}
                type="button"
                className={optionClass}
                onClick={() => handleSelectOption(idx)}
                disabled={isSubmitted}
              >
                <div className="option-letter">{optionLetters[idx]}</div>
                <div style={{ flex: 1 }}>{optionText}</div>
                {isSubmitted && isCorrectAnswer && (
                  <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                )}
                {isSubmitted && isSelected && !isCorrectAnswer && (
                  <XCircle size={18} color="var(--danger)" style={{ flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Pedagogical Explanation Box (Revealed after submission) */}
        {isSubmitted && (
          <div
            className={`explanation-box ${
              selectedOption === currentQuestion.correctAnswerIndex ? 'correct' : 'incorrect'
            }`}
          >
            <div className="explanation-title">
              {selectedOption === currentQuestion.correctAnswerIndex ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Correct! Spot-on conceptual understanding.</span>
                </>
              ) : (
                <>
                  <XCircle size={18} />
                  <span>Not quite right. Let's review the lecture concept:</span>
                </>
              )}
            </div>
            <p className="explanation-text">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="quiz-action-bar">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {!isSubmitted
              ? selectedOption === null
                ? 'Select an option to submit your answer'
                : 'Ready to submit'
              : 'Review explanation above and proceed'}
          </div>

          {!isSubmitted ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
            >
              Submit Answer
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNextQuestion}>
              <span>{currentIndex + 1 < totalQuestions ? 'Next Question' : 'View Final Score'}</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
