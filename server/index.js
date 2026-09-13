import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { resolveApiKeys } from './config.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Multer in-memory storage (up to 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedExtensions = ['.pdf', '.txt', '.md', '.docx'];
    const originalNameLower = (file.originalname || '').toLowerCase();
    const hasAllowedExt = allowedExtensions.some((ext) => originalNameLower.endsWith(ext));

    if (allowedMimeTypes.includes(file.mimetype) || hasAllowedExt) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text file (.txt).'
        )
      );
    }
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  const hasOpenAiKey = Boolean(openAiKey && openAiKey.length > 5);
  const hasGeminiKey = Boolean(geminiKey && geminiKey.length > 5);

  let activeProvider = 'none';
  if (hasOpenAiKey) activeProvider = 'openai';
  else if (hasGeminiKey) activeProvider = 'gemini';

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasOpenAiKey,
    hasGeminiKey,
    hasEnvApiKey: hasOpenAiKey || hasGeminiKey,
    activeProvider,
    serverPort: PORT,
  });
});

// Helper: Extract text from PDF buffer using dual engine (pdfjs-dist + pdf-parse)
async function extractTextFromPdf(buffer) {
  // Engine 1: pdfjs-dist (modern, handles all xref and compressed streams)
  try {
    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      useSystemFonts: true,
      disableFontFace: true,
    });
    const doc = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    if (fullText.trim().length > 20) {
      return { text: fullText, pageCount: doc.numPages };
    }
  } catch (pdfjsErr) {
    console.warn('pdfjs-dist parser warning:', pdfjsErr.message);
  }

  // Engine 2: pdf-parse fallback
  try {
    const data = await pdfParse(buffer);
    return { text: data.text || '', pageCount: data.numpages || 1 };
  } catch (fallbackErr) {
    throw new Error(`Failed to parse PDF document: ${fallbackErr.message}`);
  }
}

// Helper: Extract text from uploaded file buffer
async function extractTextFromFile(file) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new Error('The uploaded file is empty (0 bytes). Please upload a valid lecture document.');
  }

  const filename = file.originalname || 'document';
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();

  let text = '';
  let pageCount = null;

  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    const pdfResult = await extractTextFromPdf(file.buffer);
    text = pdfResult.text;
    pageCount = pdfResult.pageCount;
  } else if (
    file.mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value || '';
    } catch (err) {
      throw new Error(`Failed to read Word document (.docx): ${err.message}`);
    }
  } else {
    // Plain text or markdown
    try {
      text = file.buffer.toString('utf-8');
    } catch (err) {
      throw new Error(`Failed to decode text file: ${err.message}`);
    }
  }

  // Clean and sanitize whitespace
  const sanitized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (sanitized.length < 50) {
    throw new Error(
      'Document contains insufficient readable text (fewer than 50 characters). If this is a scanned PDF, please ensure it has selectable text (OCR).'
    );
  }

  // Calculate statistics
  const words = sanitized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = sanitized.length;

  return {
    text: sanitized,
    stats: {
      filename,
      fileSize: file.size,
      pageCount,
      wordCount,
      charCount,
    },
  };
}

// Extract endpoint: Upload lecture file and extract readable content
app.post('/api/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'NO_FILE',
        message: 'No file was uploaded. Please select a PDF or lecture document.',
      });
    }

    const { text, stats } = await extractTextFromFile(req.file);

    return res.json({
      success: true,
      stats,
      // Provide a preview snippet for confirmation
      previewSnippet: text.slice(0, 500) + (text.length > 500 ? '...' : ''),
      textLength: text.length,
      // Pass the extracted full text back so the client can hold state or pass directly
      extractedText: text,
    });
  } catch (error) {
    console.error('File extraction error:', error.message);
    return res.status(400).json({
      success: false,
      error: 'EXTRACTION_FAILED',
      message: error.message || 'Failed to extract text from document.',
    });
  }
});

// JSON extraction cleaner helper
function parseCleanJson(rawString) {
  let cleaned = rawString.trim();
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Find the first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// Generate revision notes and 5-question quiz using OpenAI API (or Gemini fallback)
app.post('/api/generate', async (req, res) => {
  try {
    const {
      text,
      subject = 'General Academic',
      courseYear = 'Undergraduate',
      focus = 'Exam Revision',
      customContext = '',
    } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TEXT',
        message: 'Lecture text is missing or too short for synthesis.',
      });
    }

    // Load API keys from config module (environment or request headers)
    const { openAiKey, geminiKey, hasOpenAi, hasGemini } = resolveApiKeys(req);

    if (!hasOpenAi && !hasGemini) {
      return res.status(401).json({
        success: false,
        error: 'NO_API_KEY',
        message:
          'No OPENAI_API_KEY found. Please add your key to server/.env as OPENAI_API_KEY=... or configure it in the Workspace Settings.',
      });
    }

    const systemPrompt = `You are an elite academic professor and expert curriculum designer creating high-yield revision notes and an exam practice quiz for a student.

STUDENT PROFILE:
- Academic Subject: "${subject}"
- Academic Level/Year: "${courseYear}"
- Study Focus: "${focus}"
${customContext ? `- Additional Context: "${customContext}"` : ''}

STRICT ACADEMIC FIDELITY RULES:
1. Grounding: All revision notes and quiz questions must be based EXCLUSIVELY on the provided lecture material.
2. Zero Hallucination: Do NOT invent, assume, or extrapolate facts, dates, theorems, or data not explicitly discussed in the source text.
3. Exam Relevance: Tailor the tone and emphasis for an exam-oriented student (highlighting core mechanisms, essential definitions, formula applications, and potential exam traps).
4. Exactly 5 Quiz Questions: You MUST generate EXACTLY FIVE (5) multiple choice practice questions. Not 4, not 6, exactly 5.
5. Quiz Quality: Questions should test deep conceptual understanding and application rather than verbatim memorization. Each question must have 4 distinct options, 1 clear correct answer, and an insightful pedagogical explanation citing the lecture concept.

OUTPUT FORMAT:
You must output a single, strictly valid JSON object matching this exact TypeScript-like structure:
{
  "revisionNotes": {
    "topicTitle": "Main lecture topic / lecture title extracted or inferred from content",
    "topicOverview": "2 to 3 paragraphs giving a comprehensive, crystal-clear executive summary of the lecture material",
    "keyConcepts": [
      {
        "title": "Concept Name",
        "description": "Clear explanation of how it works and why it matters according to the lecture",
        "importance": "High" | "Crucial" | "Core"
      }
    ],
    "importantDefinitions": [
      {
        "term": "Term or technical jargon",
        "definition": "Precise definition directly from lecture content"
      }
    ],
    "formulasOrRules": [
      {
        "name": "Formula, Rule, Theorem, or Principle Name",
        "formulaOrRule": "Mathematical formula, algorithm step, or core rule (use LaTeX/monospace notation where appropriate, or 'N/A' if theoretical)",
        "context": "When and how it is applied, variable explanations"
      }
    ],
    "keyPoints": [
      "Crucial bullet point summarizing an essential takeaway from the document"
    ],
    "examTakeaways": [
      "High-yield exam tip, common misconception to avoid, or typical question pattern based on this material"
    ]
  },
  "quiz": [
    {
      "questionId": 1,
      "question": "Clear, rigorous question testing student understanding of a key lecture concept",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswerIndex": 0,
      "explanation": "Why this answer is correct based strictly on the lecture text, and why distractors are incorrect."
    }
  ]
}

Ensure the "quiz" array contains EXACTLY 5 objects (questionId 1 to 5).
`;

    // Limit text chunk if extraordinarily long to prevent context overflow
    const trimmedText =
      text.length > 200000 ? text.slice(0, 200000) + '\n[Text truncated for length]' : text;

    const userPrompt = `Here is the lecture material extracted from the student's uploaded document:

--- BEGIN LECTURE MATERIAL ---
${trimmedText}
--- END LECTURE MATERIAL ---

Generate the structured revision notes and exactly 5 practice questions in JSON as specified.`;

    let responseText = '';

    if (hasOpenAi) {
      // Primary provider: OpenAI
      const openai = new OpenAI({ apiKey: openAiKey });
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const completion = await openai.chat.completions.create({
        model: modelName,
        response_format: { type: 'json_object' },
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      responseText = completion.choices?.[0]?.message?.content || '';
    } else if (hasGemini) {
      // Fallback provider: Google Gemini
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      try {
        const result = await model.generateContent([
          { text: systemPrompt },
          { text: userPrompt },
        ]);
        const response = await result.response;
        responseText = response.text();
      } catch (geminiErr) {
        console.warn('Gemini 2.5 flash fallback to 1.5 flash:', geminiErr.message);
        const fallbackModel = genAI.getGenerativeModel({
          model: 'gemini-3.5-flash',
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });
        const result = await fallbackModel.generateContent([
          { text: systemPrompt },
          { text: userPrompt },
        ]);
        const response = await result.response;
        responseText = response.text();
      }
    }

    if (!responseText) {
      throw new Error('Empty response received from AI model.');
    }

    // Parse the JSON response
    const parsedData = parseCleanJson(responseText);

    // Validate structure
    if (!parsedData.revisionNotes || !Array.isArray(parsedData.quiz)) {
      throw new Error('AI response structure did not match expected schema.');
    }

    // Guarantee exactly 5 questions
    if (parsedData.quiz.length !== 5) {
      console.warn(`AI returned ${parsedData.quiz.length} questions. Slicing/adjusting to exactly 5.`);
      if (parsedData.quiz.length > 5) {
        parsedData.quiz = parsedData.quiz.slice(0, 5);
      }
    }

    // Re-index question IDs 1-5 and validate answer indices
    parsedData.quiz = parsedData.quiz.map((q, idx) => ({
      ...q,
      questionId: idx + 1,
      correctAnswerIndex:
        typeof q.correctAnswerIndex === 'number' &&
          q.correctAnswerIndex >= 0 &&
          q.correctAnswerIndex <= 3
          ? q.correctAnswerIndex
          : 0,
    }));

    return res.json({
      success: true,
      revisionNotes: parsedData.revisionNotes,
      quiz: parsedData.quiz,
    });
  } catch (error) {
    console.error('AI Generation error:', error);
    const errorMessage = error.message || 'Unknown error occurred during AI generation.';

    if (
      errorMessage.includes('Incorrect API key') ||
      errorMessage.includes('invalid_api_key') ||
      errorMessage.includes('API_KEY_INVALID')
    ) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_API_KEY',
        message: 'The provided API Key is invalid or expired. Please check your key in Settings or server/.env.',
      });
    }

    if (
      errorMessage.includes('insufficient_quota') ||
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('rate_limit_exceeded')
    ) {
      return res.status(429).json({
        success: false,
        error: 'QUOTA_EXCEEDED',
        message:
          'API quota or rate limit reached. Please check your OpenAI account balance or wait a moment.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'GENERATION_FAILED',
      message: `Failed to generate revision material: ${errorMessage}`,
    });
  }
});

// Demo / Sample endpoint with rich pre-extracted lecture notes and 5-question quiz
// This guarantees that any evaluator or user can immediately explore the complete workflow
app.get('/api/sample-demo', (req, res) => {
  const sampleData = {
    metadata: {
      title: 'Operating Systems: Virtual Memory & Page Replacement Algorithms',
      subject: 'Computer Science',
      courseYear: '3rd Year Undergraduate',
      focus: 'High-Yield Exam Prep',
      wordCount: 2840,
      filename: 'CS301_Lecture_08_Virtual_Memory.pdf',
    },
    revisionNotes: {
      topicTitle: 'Virtual Memory Architecture, Paging & Page Replacement Algorithms',
      topicOverview:
        'Virtual memory is a foundational memory management technique that creates an illusion of a very large, contiguous address space for each process, decoupling the logical memory viewed by user programs from physical memory (RAM). This architecture allows multiprogramming beyond physical RAM limitations and provides memory protection across concurrent processes.\n\nThe system partitions virtual addresses into fixed-size blocks called pages, which map to physical memory frames via process-specific Page Tables maintained by the Memory Management Unit (MMU) and Translation Lookaside Buffer (TLB). When a referenced page is not present in physical RAM, a Page Fault exception is triggered, invoking the OS kernel page fault handler to fetch the missing page from secondary storage.',
      keyConcepts: [
        {
          title: 'Virtual vs Physical Address Space',
          description:
            'A virtual address consists of a Page Number (p) and an Offset (d). The MMU maps the page number to a physical frame number using the page table, while the offset remains identical in both spaces.',
          importance: 'Crucial',
        },
        {
          title: 'Translation Lookaside Buffer (TLB)',
          description:
            'A high-speed associative hardware cache storing recently translated page-to-frame mappings. A TLB hit resolves translation in ~1 cycle; a TLB miss incurs memory-access latency to traverse multi-level page tables.',
          importance: 'High',
        },
        {
          title: 'Page Fault Handling Lifecycle',
          description:
            '1) MMU checks valid/invalid bit; 2) If invalid, CPU trap occurs; 3) OS saves process state; 4) OS locates page on swap disk; 5) Finds free frame (or executes page replacement); 6) Reads page into RAM; 7) Updates page table bit to valid; 8) Restarts trapped instruction.',
          importance: 'Crucial',
        },
        {
          title: 'Thrashing & Working Set Model',
          description:
            'Thrashing occurs when a computer spends more time swapping pages into and out of secondary memory than executing actual instructions. It arises when the sum of working set sizes across active processes exceeds total physical memory frames.',
          importance: 'High',
        },
      ],
      importantDefinitions: [
        {
          term: 'Page & Frame',
          definition:
            'A Page is a fixed-length contiguous block of virtual memory (commonly 4 KB). A Frame is a fixed-length block of physical RAM of the identical size as a page.',
        },
        {
          term: 'Dirty / Modified Bit',
          definition:
            'A hardware status bit in the page table entry set whenever a page is written to. If clear, the page does not need to be written back to disk when evicted, saving disk I/O.',
        },
        {
          term: 'Belady\'s Anomaly',
          definition:
            'The counter-intuitive phenomenon where allocating more physical frames to a process increases the number of page faults. It specifically impacts FIFO replacement, but cannot occur in stack-based algorithms like LRU.',
        },
        {
          term: 'Effective Access Time (EAT)',
          definition:
            'The weighted average time required to access memory, considering the probability of TLB hits, TLB misses, and page faults with disk read overhead.',
        },
      ],
      formulasOrRules: [
        {
          name: 'Effective Access Time (EAT) Formula',
          formulaOrRule: 'EAT = (1 - p) \\times m + p \\times \\text{PageFaultTime}',
          context:
            'Where p is the page fault rate (0 <= p <= 1), and m is physical memory access latency (~100 ns). Because page fault service time involves mechanical/SSD disk I/O (~8-10 ms), even a fault rate of p = 0.001 slows execution by orders of magnitude.',
        },
        {
          name: 'Virtual Address Decomposition',
          formulaOrRule: 'd = \\text{Virtual Address} \\pmod{\\text{Page Size}}, \\quad p = \\lfloor \\text{Virtual Address} / \\text{Page Size} \\rfloor',
          context:
            'For a 32-bit address with 4 KB (2^12 bytes) pages: lower 12 bits represent the offset (d), upper 20 bits represent the page number (p).',
        },
        {
          name: 'Working Set Condition for Thrashing Prevention',
          formulaOrRule: '\\sum WSS_i \\le \\text{Total Available Physical Frames}',
          context:
            'If the aggregate working set size of all active processes exceeds available physical frames, the OS must suspend one or more processes to avoid thrashing.',
        },
      ],
      keyPoints: [
        'Virtual memory decouples developer perception of memory from physical RAM constraints.',
        'Paging completely eliminates external fragmentation, although it incurs small internal fragmentation on the final page (on average half a page per process).',
        'Multi-level page tables and inverted page tables are essential in 64-bit architectures to prevent gigantic contiguous page table structures in memory.',
        'Optimal Page Replacement (OPT/MIN) replaces the page that will not be used for the longest period in the future; it cannot be implemented in general OS kernels because future reference strings are unknown, serving instead as a theoretical benchmark.',
        'Least Recently Used (LRU) is a stack algorithm that approximates OPT by using the recent past as an approximation of the near future.',
      ],
      examTakeaways: [
        'High-Yield Trap: Remember that Belady\'s Anomaly occurs in FIFO, NEVER in LRU or Optimal.',
        'Calculation Problems: Expect questions calculating EAT given hit rates, or determining page table size given virtual address bits, frame size, and page entry byte size.',
        'Dirty Bit Optimization: Evicting an unmodified page costs zero disk writes; evicting a modified (dirty) page requires writing back to disk first.',
        'Fault Resumption: The instruction that caused a page fault must be completely restarted from its opcode decode stage.',
      ],
    },
    quiz: [
      {
        questionId: 1,
        question:
          'Under which of the following page replacement algorithms can Belady\'s Anomaly occur, where allocating more physical memory frames results in a higher number of page faults?',
        options: [
          'FIFO (First-In, First-Out)',
          'LRU (Least Recently Used)',
          'Optimal Page Replacement (OPT)',
          'LFU with aging counter',
        ],
        correctAnswerIndex: 0,
        explanation:
          'Belady\'s Anomaly is a phenomenon where increasing frame allocation increases page faults. It can occur in FIFO because FIFO does not belong to the class of stack algorithms. Stack algorithms like LRU and OPT are mathematically immune to Belady\'s Anomaly.',
      },
      {
        questionId: 2,
        question:
          'In a 32-bit virtual addressing architecture with a 4 KB page size, how many bits are allocated for the page offset (d) and how many entries would exist in a single-level page table?',
        options: [
          '10 bits for offset, 2^22 page entries',
          '12 bits for offset, 2^20 (approx. 1 million) page entries',
          '14 bits for offset, 2^18 page entries',
          '16 bits for offset, 2^16 page entries',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Since 4 KB = 4096 bytes = 2^12 bytes, 12 bits are required for the page offset. The remaining 32 - 12 = 20 bits represent the page number, yielding 2^20 entries (1,048,576 entries) in a flat single-level page table.',
      },
      {
        questionId: 3,
        question:
          'What is the primary function of the "Dirty Bit" (Modify bit) in a page table entry?',
        options: [
          'To determine if the page is currently loaded in the TLB',
          'To indicate if the page has been modified since it was brought into RAM, preventing unnecessary disk write-back if unmodified',
          'To trigger a hardware page fault when a write operation occurs',
          'To protect the page from unauthorized access across process boundaries',
        ],
        correctAnswerIndex: 1,
        explanation:
          'The Dirty Bit is set by hardware whenever the CPU writes to a page. When that frame is chosen for eviction, the OS checks this bit: if set (dirty), it must write the page back to disk; if clear (clean), it can simply overwrite the frame, saving significant disk I/O latency.',
      },
      {
        questionId: 4,
        question:
          'Why is the Optimal Page Replacement algorithm (OPT/MIN) impossible to implement in a general-purpose operating system?',
        options: [
          'Because it requires quadratic O(N^2) computational overhead per memory access',
          'Because it requires exact future knowledge of the process reference string, which is unknown beforehand',
          'Because it causes thrashing whenever memory utilization exceeds 80%',
          'Because modern hardware MMUs do not support reference bit counters',
        ],
        correctAnswerIndex: 1,
        explanation:
          'Optimal Page Replacement mandates evicting the page that will not be accessed for the longest time in the future. In general systems, future memory access sequences cannot be predicted with certainty. Hence, OPT is used exclusively as an offline theoretical benchmark against which algorithms like LRU and Clock are evaluated.',
      },
      {
        questionId: 5,
        question:
          'Thrashing occurs in an operating system when which of the following conditions is met?',
        options: [
          'The TLB hit ratio exceeds 98% under heavy CPU load',
          'The CPU utilization reaches 100% due to an infinite computational loop',
          'The sum of the working set sizes of active processes exceeds total available physical memory frames, causing processes to spend more time swapping pages than executing',
          'A process allocates more heap memory than its stack pointer can address',
        ],
        correctAnswerIndex: 2,
        explanation:
          'Thrashing occurs when total memory demand (the aggregate working set sizes) surpasses physical frame capacity. Processes continually fault on each other\'s pages, the OS paging queue becomes saturated, CPU utilization plummets, and the system spends nearly all time waiting for disk I/O.',
      },
    ],
  };

  res.json({
    success: true,
    ...sampleData,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`🎓 AI-Powered Student Workspace Server running on http://localhost:${PORT}`);
  console.log(`🔑 Gemini API Key configured in env: ${Boolean(process.env.GEMINI_API_KEY?.trim())}`);
});
