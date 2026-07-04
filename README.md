# 🎬 YouTube Video RAG Chatbot

An AI-powered full-stack application that lets users paste a YouTube URL and have an intelligent conversation about the video content using RAG (Retrieval-Augmented Generation).

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
- 🔲 Video summarization
- 🔲 Timestamp-based answers
- 🔲 Quiz generation
- 🔲 Notes & PDF export
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
│   └── .env              # Environment variables (not committed)
└── frontend/             # React app (coming soon)
```

## ⚙️ Setup & Installation

```bash
# Clone the repo
git clone https://github.com/agarwalmanish3922-code/yt-rag-chatbot.git
cd yt-rag-chatbot/backend

# Install dependencies
npm install

# Start the server
node index.js
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

## 📈 Progress

### ✅ Phase 1 — Transcript Extraction
- Built `/api/extract` POST endpoint
- Extracts video ID from any YouTube URL format
- Fetches and cleans transcript using `youtube-transcript`

### ✅ Phase 2 — Chunking & Embeddings
- Built `chunking.js` — 500-char chunks with 50-char overlap
- Built `embeddings.js` — vector embeddings via `gemini-embedding-001`
- Built `/api/process` endpoint

### ✅ Phase 3 — Vector Storage & Similarity Search
- Built `vectorStore.js` — in-memory store with cosine similarity
- Built `/api/search` — returns top 3 relevant chunks with scores

### ✅ Phase 4 — RAG Answer Generation
- Built `chat.js` — structured RAG prompt with Gemini
- Built `/api/chat` — full pipeline: embed → search → answer

### ✅ Phase 5 — Chat Memory
- Built `memoryStore.js` — conversation history per video
- Gemini understands follow-up questions using history

## 🤝 Author
**Manish Agarwal**