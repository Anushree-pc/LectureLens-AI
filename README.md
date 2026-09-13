# 🎓 LectureLens AI — AI-Powered Student Workspace

> **Challenge:** Pick ONE student busywork flow and complete it end-to-end.  
> **Chosen Flow:** **Lecture Material → AI Revision Notes + 5-Question Practice Quiz**

---

## 🌟 Overview

**LectureLens AI** is a modern, full-stack web application designed for students to transform dense lecture materials (slides, handouts, textbook chapters) into structured, exam-oriented revision notes and an interactive 5-question comprehension quiz generated strictly from the source document.

---

## ✨ Features

- **Personalized Student Profile**:
  - Select your discipline (Computer Science, Engineering, Medicine, Law, Economics, etc.).
  - Select academic level (1st Year to Postgraduate).
  - Select study focus (High-Yield Exam Prep, Deep Concept Mastery, Quick Cram).
- **Lecture Material Ingestion**:
  - Drag-and-drop or file picker supporting **PDF** (plus Word `.docx` and plain text `.txt`).
  - Strict validation: rejects empty files, oversized files (>25MB), or corrupted scans with helpful error messages.
  - One-click **"Load Sample Lecture"** button to immediately test with a real Operating Systems lecture PDF.
- **Strictly Grounded AI Revision Notes**:
  - **Topic Overview**: Executive summary of the lecture.
  - **Key Concepts**: Core mechanisms with importance tags (*Crucial*, *High*, *Core*).
  - **Important Definitions**: Glossary-style terminology breakdown.
  - **Important Formulas & Core Rules**: Mathematical equations, algorithms, and context.
  - **Key Points**: Bulleted takeaways.
  - **Exam-Focused Takeaways & Traps**: High-yield warnings and common misconceptions.
  - **Search & Filter**: Search within generated notes in real-time.
- **Interactive 5-Question Practice Quiz**:
  - One question at a time with clear step progress.
  - 4 multiple choice options per question.
  - Instant visual feedback upon answer submission (green for correct, red for incorrect).
  - Pedagogical explanation box explaining why the correct answer is right based strictly on the lecture text.
  - Score tracker throughout the quiz.
  - **Final Scorecard**: Score percentage, mastery badge, celebratory confetti, complete question-by-question review, and "Retake Quiz" functionality.
- **Export & Sharing**:
  - Export revision notes to formatted **Markdown (`.md`)**.
  - **Print / Save as PDF** with a dedicated clean academic print stylesheet.
  - Export practice quiz and answer key to Markdown.
  - Copy to clipboard.
- **Polished UI/UX**:
  - Sleek **Dark Mode** and **Light Mode** toggle.
  - Glassmorphism, modern typography (Plus Jakarta Sans, Inter, JetBrains Mono), smooth micro-animations.
  - Fully responsive across desktop, tablet, and mobile devices.
  - Secure API Key modal (stored in session headers, never exposed to frontend bundles).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Installation

Install dependencies for both the backend server and frontend client:
```bash
npm run install:all
```
*(Or navigate into `server` and `client` separately and run `npm install`)*

### 2. Configure Google Gemini API Key

You can configure your key in either of two ways:

#### Option A: Server `.env` file (Recommended for local dev)
Create or edit `server/.env`:
```env
PORT=3001
GEMINI_API_KEY=your_google_gemini_api_key_here
```
> Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

#### Option B: In-App UI Settings Modal
Click the **"Configure API Key"** button in the top-right header of the web app to paste your API key directly for the session.

---

### 3. Run the Application

Start both the backend API server (`localhost:3001`) and Vite frontend dev server (`localhost:5173`) with a single command:

```bash
npm run dev
```

Open your browser at:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📁 Architecture & Directory Structure

```
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ApiKeyModal.jsx      # API key configuration & status
│   │   │   ├── FinalScorecard.jsx   # Score display, grade, review breakdown
│   │   │   ├── ProcessingView.jsx   # Animated 4-step pipeline status
│   │   │   ├── QuizExperience.jsx   # 5-question interactive quiz
│   │   │   ├── RevisionNotes.jsx    # Notes view, search filter & export
│   │   │   └── UploadZone.jsx       # Personalization & PDF dropzone
│   │   ├── App.jsx                  # Main application state machine
│   │   ├── index.css                # Custom CSS design system & print styles
│   │   └── main.jsx
│   ├── public/
│   │   └── sample_lecture.pdf       # Pre-bundled lecture PDF for 1-click testing
│   └── vite.config.js               # Vite config with API proxy to localhost:3001
│
├── server/                     # Backend API (Node.js + Express)
│   ├── index.js                     # Express server, PDF extraction & Gemini API
│   ├── generate-sample-pdf.js       # Script to generate sample academic lecture PDFs
│   ├── .env.example                 # Environment template
│   └── package.json
│
├── samples/                    # Sample lecture PDFs for offline testing
├── start-dev.js                # Root cross-platform launcher
├── package.json                # Root package configuration
└── README.md
```

---

## 🧪 Testing Verification

1. **Health Check**: `GET http://localhost:3001/api/health`
2. **Text Extraction**: `POST http://localhost:3001/api/extract` (accepts multipart file upload)
3. **AI Generation**: `POST http://localhost:3001/api/generate` (strictly validates 5 questions & structured notes)
4. **Demo Workspace**: `GET http://localhost:3001/api/sample-demo` (provides instant pre-synthesized data for offline testing)
