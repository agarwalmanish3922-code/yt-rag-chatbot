# 🎬 YouTube Learning Assistant
### *Learn smarter. Skip the fluff. Keep the knowledge.*

An AI-powered full-stack application that lets students paste a YouTube URL and have an intelligent conversation about the video content, generate smart notes, test themselves with MCQs, prepare for interviews, skip unnecessary parts, and save valuable study time — all powered by RAG (Retrieval-Augmented Generation).

## 🚀 Live Demo
> Coming soon after deployment

## 🧠 How It Works
1. User signs up / logs in
2. User pastes a YouTube URL
3. System extracts and cleans the video transcript
4. Transcript is split into chunks and converted to vector embeddings
5. User asks a question — it gets converted to an embedding
6. Cosine similarity search finds the most relevant chunks
7. Gemini LLM generates an answer strictly based on video content
8. Chat memory allows natural follow-up questions
9. Smart trimmer identifies and skips unnecessary parts of the video
10. Notes generator creates structured college-style PDF study notes
11. MCQ & Interview question generators help with self-testing and prep
12. All data is isolated per user and persisted in MongoDB

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| LLM (Chat/Trim/Summary) | Google Gemini API |
| LLM (Notes/MCQ/Interview) | Groq API — Llama 3.1 8B Instant |
| Embeddings | Gemini Embedding Model |
| Vector Search | In-memory Cosine Similarity (per-user isolated) |
| PDF Generation | PDFKit |
| Transcript | youtube-transcript npm package |

## 📦 Features
- ✅ User authentication (signup/login/logout)
- ✅ YouTube transcript extraction
- ✅ Smart text chunking with overlap
- ✅ Vector embeddings via Gemini
- ✅ Cosine similarity search
- ✅ RAG-based answer generation
- ✅ Chat memory for follow-up questions
- ✅ Modern React frontend with animations
- ✅ Video summarization
- ✅ College-style PDF notes generation
- ✅ MCQ generation with interactive quiz and scoring
- ✅ Interview questions generator (Basic/Intermediate/Advanced)
- ✅ Multi-video support with instant switching
- ✅ Per-user data isolation (MongoDB-backed history)
- 🔧 Smart Video Trimmer — under construction (accuracy improvements pending)
- 🔲 3D Neural Interface Frontend Redesign
- 🔲 Deployment

## 📁 Project Structure
```
yt-rag-chatbot/
├── backend/
│   ├── index.js              # Express server & API routes
│   ├── db.js                 # MongoDB connection (with DNS fix)
│   ├── chunking.js           # Text chunking logic
│   ├── embeddings.js         # Gemini embedding generation
│   ├── vectorStore.js        # In-memory vector store (per-user isolated)
│   ├── memoryStore.js        # Conversation history (per-user isolated)
│   ├── chat.js                # RAG prompt & Gemini answer generation
│   ├── trimmer.js             # Smart Video Trimmer logic
│   ├── notesGenerator.js     # PDF notes generation (Groq + Gemini hybrid)
│   ├── mcqGenerator.js       # MCQ generation (Groq)
│   ├── interviewGenerator.js # Interview questions generation (Groq)
│   ├── models/
│   │   ├── User.js           # User schema
│   │   └── VideoHistory.js   # Video history schema
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── routes/
│   │   └── auth.js           # Signup/Login/Me routes
│   └── .env                  # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Animations and styling
│   │   ├── Auth.js           # Login/Signup UI
│   │   ├── AuthContext.js    # Auth state management
│   │   └── index.js          # React entry point
│   └── public/
├── assets/                   # Screenshots and demo GIF
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
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
```

## 🔌 API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create new user account |
| POST | `/api/auth/login` | No | Login and receive JWT token |
| GET | `/api/auth/me` | Yes | Get current logged-in user |
| POST | `/api/extract` | No | Extract transcript from YouTube URL |
| POST | `/api/process` | Yes | Chunk and embed transcript |
| POST | `/api/search` | Yes | Similarity search on stored chunks |
| POST | `/api/chat` | Yes | Full RAG pipeline — ask a question |
| POST | `/api/clear-history` | Yes | Reset conversation history |
| POST | `/api/summarize` | No | Generate structured video summary |
| POST | `/api/trim` | No | Smart trim — identify content segments |
| POST | `/api/notes` | No | Generate college-style PDF study notes |
| POST | `/api/mcq` | No | Generate MCQ quiz |
| POST | `/api/interview` | No | Generate interview questions |
| POST | `/api/history/save` | Yes | Save video to user's history |
| GET | `/api/history/list` | Yes | Get user's video history |

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
- Skips re-processing already-embedded videos for instant switching

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
- Responsive design for mobile and desktop

### ✅ Phase 7 — Video Summarization
- Added `summarizeVideo()` function in `chat.js`
- Built `/api/summarize` endpoint
- Added Summarize button in frontend
- Structured summary with Main Topic, Key Points, Takeaways, Important Terms
- Multi-model fallback for quota handling

### ✅ Phase 8 — Smart Video Trimmer (Under Construction)
- Built `trimmer.js` — single API call with adaptive sampling (~150 sample points)
- Validates results — rejects unrealistic outputs automatically
- Returns clickable YouTube timestamp deep links
- Shows time saved stats with percentage
- ⚠️ Accuracy improvements in progress — transcript-only analysis has inherent limits
- Tagline: "Skip the fluff. Keep the knowledge."

### ✅ Phase 9 — Smart PDF Notes Generation
- Built `notesGenerator.js` — hybrid: Groq for short videos, Gemini for long videos
- Groq (llama-3.1-8b-instant) — ultra fast, generous free tier
- Gemini — handles long videos with smart transcript sampling
- College-style PDF: dark section headers, bullet points, key formulas, examples
- Includes: chapter title, sections, key terms, quick revision, practice questions
- Download button — PDF ready on demand
- Built `/api/notes` endpoint returning PDF binary

### ✅ Phase 10 — MCQ Generation
- Built `mcqGenerator.js` — generates MCQs using Groq
- Built `/api/mcq` endpoint
- Interactive quiz UI with 4 options per question
- Color-coded results — green for correct, red for wrong
- Score display with percentage and retake option
- Explanation shown after submission

### ✅ Phase 11 — Interview Questions Generator
- Built `interviewGenerator.js` — generates interview Qs using Groq
- Built `/api/interview` endpoint
- Questions organized by difficulty: Basic, Intermediate, Advanced
- Each question includes an answering tip

### ✅ Phase 12 — Multi-video Support
- Added video history bar — switch between recent videos instantly
- Backend skips re-processing already-embedded videos
- History synced with MongoDB per logged-in user

### ✅ Phase 13 — User Authentication
- Built User & VideoHistory models with Mongoose
- MongoDB Atlas integration with DNS fix for Windows (`dns.setServers`)
- JWT-based authentication with 30-day token expiry
- Password hashing with bcryptjs
- Signup/Login UI with tab switcher
- Protected routes via authMiddleware
- Per-user data isolation — vectorStore and memoryStore keyed by `userId + videoId`
- Video history persisted in MongoDB
- Logout functionality

## 🗺️ Upcoming Phases
- 🔲 Phase 14 — Smart Trim Accuracy Improvements
- 🔲 Phase 15 — 3D Neural Interface Frontend Redesign
- 🔲 Phase 16 — Deployment
- 🔲 Phase 17 — Final Polish & Live Demo

## 🤝 Author
**Manish Agarwal**  
B.Tech CSE — Uttaranchal University, Dehradun  
[GitHub](https://github.com/agarwalmanish3922-code)