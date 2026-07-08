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
9. Notes generator creates structured study notes from the video

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| LLM | Google Gemini API |
| Embeddings | Gemini Embedding Model |
| Vector Search | In-memory Cosine Similarity |
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
- ✅ Smart Video Trimmer — skip unnecessary parts
- 🔲 Notes generation
- 🔲 Timestamp-based answers
- 🔲 MCQ & Quiz generation
- 🔲 Interview questions generator
- 🔲 PDF export
- 🔲 Multi-video support
- 🔲 User authentication

## 📁 Project Structure
```
yt-rag-chatbot/
├── backend/
│   ├── index.js          # Express server & API routes
│   ├── chunking.js       # Text chunking logic
│   ├── embeddings.js     # Gemini embedding generation
│   ├── vectorStore.js    # In-memory vector storage & cosine similarity
│   ├── memoryStore.js    # Conversation history management
│   ├── chat.js           # RAG prompt & Gemini answer generation
│   ├── trimmer.js        # Smart Video Trimmer logic
│   └── .env              # Environment variables (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── App.css       # Animations and styling
│   │   └── index.js      # React entry point
│   └── public/
├── assets/               # Screenshots and demo GIF
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

## 📈 Progress

### ✅ Phase 1 — Transcript Extraction
- Built `/api/extract` POST endpoint
- Extracts video ID from any YouTube URL format
- Fetches and cleans transcript using `youtube-transcript`
- Also returns raw transcript with timestamps for Smart Trimmer

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
- Multi-model fallback system — tries multiple Gemini models if quota exceeded

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
- Added 📝 Summarize button in frontend
- Structured summary with Main Topic, Key Points, Takeaways, Important Terms
- Multi-model fallback for quota handling
- Summary card with close button in UI

### ✅ Phase 8 — Smart Video Trimmer
- Built `trimmer.js` — single API call approach for any video length
- Adaptive sampling — always takes ~150 sample points regardless of video length
- Validates results — rejects unrealistic outputs (0% or 99% saved)
- Merges close segments — no tiny fragments under 60 seconds
- Smart fallback — trims intro/outro if Gemini fails
- Returns clickable YouTube timestamp deep links
- Shows time saved stats (original vs content duration + percentage)
- Works for videos of any length — tested on 5+ hour videos
- Tagline: "Skip the fluff. Keep the knowledge."

## 🗺️ Upcoming Phases
- 🔲 Phase 9 — Notes Generation
- 🔲 Phase 10 — Timestamp-based Answers
- 🔲 Phase 11 — MCQ Generation
- 🔲 Phase 12 — Interview Questions Generator
- 🔲 Phase 13 — Quiz Me Mode
- 🔲 Phase 14 — PDF Export
- 🔲 Phase 15 — Multi-video Support
- 🔲 Phase 16 — 3D Neural Interface Frontend Redesign
- 🔲 Phase 17 — User Authentication
- 🔲 Phase 18 — Conversation History
- 🔲 Phase 19 — Deployment
- 🔲 Phase 20 — Final Polish & Demo

## 🤝 Author
**Manish Agarwal**