# 🎬 YouTube Learning Assistant
### *Learn smarter. Skip the fluff. Keep the knowledge.*

An AI-powered full-stack application that lets students paste a YouTube URL and have an intelligent conversation about the video content, generate smart notes, skip unnecessary parts, and save valuable study time — all powered by RAG (Retrieval-Augmented Generation).

## 🚀 Live Demo
> Coming soon after deployment

## 🧠 How It Works
1. User pastes a YouTube URL
2. System extracts and cleans the video transcript
3. Transcript is split into chunks and converted to vector embeddings
4. User asks a question — it gets converted to an embedding
5. Cosine similarity search finds the most relevant chunks
6. Gemini LLM generates an answer strictly based on video content
7. Chat memory allows natural follow-up questions
8. Smart trimmer identifies and skips unnecessary parts of the video
9. Notes generator creates structured college-style PDF study notes

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js + Express |
| LLM (Chat/Trim/Summary) | Google Gemini API |
| LLM (Notes Generation) | Groq API — Llama 3.1 8B Instant |
| Embeddings | Gemini Embedding Model |
| Vector Search | In-memory Cosine Similarity |
| PDF Generation | PDFKit |
| Transcript | youtube-transcript npm package |

## 📦 Features
- ✅ YouTube transcript extraction
- ✅ Smart text chunking with overlap
- ✅ Vector embeddings via Gemini
- ✅ Cosine similarity search
- ✅ RAG-based answer generation
- ✅ Chat memory for follow-up questions
- ✅ Modern React frontend with animations
- ✅ Video summarization
- ✅ College-style PDF notes generation
- 🔧 Smart Video Trimmer — under construction (accuracy improvements pending)
- ✅ MCQ & Quiz generation
- ✅ Interview questions generator
- 🔲 Multi-video support
- 🔲 User authentication
- 🔲 3D Neural Interface Frontend

## 📁 Project Structure
```
yt-rag-chatbot/
├── backend/
│   ├── index.js            # Express server & API routes
│   ├── chunking.js         # Text chunking logic
│   ├── embeddings.js       # Gemini embedding generation
│   ├── vectorStore.js      # In-memory vector storage & cosine similarity
│   ├── memoryStore.js      # Conversation history management
│   ├── chat.js             # RAG prompt & Gemini answer generation
│   ├── trimmer.js          # Smart Video Trimmer logic
│   ├── notesGenerator.js   # PDF notes generation (Groq + Gemini hybrid)
│   └── .env                # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Animations and styling
│   │   └── index.js        # React entry point
│   └── public/
├── assets/                 # Screenshots and demo GIF
└── README.md
```

## ⚙️ Setup & Installation

```bash
# Clone the repo
git clone https://github.com/agarwalmanish3922-code/yt-rag-chatbot.git

# Setup backend
cd yt-rag-chatbot/backend
npm install
node index.js

# Setup frontend (open a new terminal)
cd yt-rag-chatbot/frontend
npm install
npm start
```

Create a `.env` file in `backend/`:
```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/extract` | Extract transcript from YouTube URL |
| POST | `/api/process` | Chunk and embed transcript |
| POST | `/api/search` | Similarity search on stored chunks |
| POST | `/api/chat` | Full RAG pipeline — ask a question |
| POST | `/api/clear-history` | Reset conversation history |
| POST | `/api/summarize` | Generate structured video summary |
| POST | `/api/trim` | Smart trim — identify content segments |
| POST | `/api/notes` | Generate college-style PDF study notes |

## 📈 Progress

### ✅ Phase 1 — Transcript Extraction
- Built `/api/extract` POST endpoint
- Extracts video ID from any YouTube URL format
- Fetches and cleans transcript using `youtube-transcript`
- Returns raw transcript with timestamps for Smart Trimmer

### ✅ Phase 2 — Chunking & Embeddings
- Built `chunking.js` — 1000-char chunks with 100-char overlap
- Built `embeddings.js` — vector embeddings via `gemini-embedding-001`
- Built `/api/process` endpoint with 200ms delay between calls
- Max 50 chunks per video to prevent quota exhaustion

### ✅ Phase 3 — Vector Storage & Similarity Search
- Built `vectorStore.js` — in-memory store with cosine similarity
- Built `/api/search` — returns top 3 relevant chunks with scores

### ✅ Phase 4 — RAG Answer Generation
- Built `chat.js` — structured RAG prompt with Gemini
- Built `/api/chat` — full pipeline: embed → search → answer
- Multi-model fallback system across 6 Gemini models

### ✅ Phase 5 — Chat Memory
- Built `memoryStore.js` — conversation history per video
- Gemini understands follow-up questions using history
- Built `/api/clear-history` endpoint

### ✅ Phase 6 — React Frontend
- Built modern React UI with glassmorphism design
- Dark mode with purple/pink gradient accents
- Animated floating particles and background orbs
- Side decorations with glowing dots and icons
- Stats bar showing tech highlights
- URL input with animated progress bar
- Loading animation with spinning rings and step indicators
- Chat interface with typing indicator and message animations
- Feature cards on landing page
- New Chat button to switch videos without refresh
- Fully connected to backend APIs
- Responsive design for mobile and desktop

### ✅ Phase 7 — Video Summarization
- Added `summarizeVideo()` function in `chat.js`
- Built `/api/summarize` endpoint
- Added Summarize button in frontend
- Structured summary with Main Topic, Key Points, Takeaways, Important Terms
- Multi-model fallback for quota handling

### ✅ Phase 8 — Smart Video Trimmer (Under Construction)
- Built `trimmer.js` — single API call with adaptive sampling
- Validates results — rejects unrealistic outputs automatically
- Returns clickable YouTube timestamp deep links
- Shows time saved stats with percentage
- ⚠️ Accuracy improvements in progress
- Tagline: "Skip the fluff. Keep the knowledge."

### ✅ Phase 9+14 — Smart PDF Notes Generation
- Built `notesGenerator.js` — hybrid: Groq for short videos, Gemini for long videos
- Groq (llama-3.1-8b-instant) — ultra fast, generous free tier
- Gemini — handles long videos with smart transcript sampling
- College-style PDF: dark section headers, bullet points, key formulas, examples
- Includes: chapter title, sections, key terms, quick revision, practice questions
- Download button — PDF ready on demand, no auto-download
- Built `/api/notes` endpoint returning PDF binary

### ✅ Phase 10 — MCQ Generation
- Built `mcqGenerator.js` — generates MCQs using Groq (llama-3.1-8b-instant)
- Built `/api/mcq` endpoint
- Interactive quiz UI with 4 options per question
- Color-coded results — green for correct, red for wrong
- Score display with percentage
- Explanation shown after submission
- Retake quiz option
- Added ❓ Generate MCQs button in frontend

### ✅ Phase 11 — Interview Questions Generator
- Built `interviewGenerator.js` — generates interview  Qs using Groq
- Built `/api/interview` endpoint
- Questions organized by difficulty: Basic, Intermediate, Advanced
- Each question includes an answering tip
- Added 💼 Interview Prep button in frontend
- Fixed result card layout — proper spacing between Summary, Notes, MCQ, Interview, Trim cards

## 🗺️ Upcoming Phases
- 🔲 Phase 12 — Quiz Me Mode
- 🔲 Phase 13 — Multi-video Support
- 🔲 Phase 14 — Smart Trim Accuracy Improvements
- 🔲 Phase 15 — 3D Neural Interface Frontend Redesign
- 🔲 Phase 16 — User Authentication
- 🔲 Phase 17 — Conversation History
- 🔲 Phase 18 — Deployment
- 🔲 Phase 19 — Final Polish & Live Demo

## 🤝 Author
**Manish Agarwal**  
B.Tech CSE — Uttaranchal University, Dehradun  
[GitHub](https://github.com/agarwalmanish3922-code)