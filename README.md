# YouTube Video RAG Chatbot

A full-stack RAG application that lets users paste a YouTube URL and ask questions about the video content.

## Tech Stack
- Frontend: React
- Backend: Node.js + Express
- LLM: Gemini API
- Vector Search: In-memory cosine similarity (Phase 1-4), FAISS/ChromaDB (later)

## Progress

### ✅ Phase 1 — Transcript Extraction
- Built `/api/extract` POST endpoint
- Extracts video ID from any YouTube URL format
- Fetches transcript using `youtube-transcript` package
- Cleans transcript (removes [Music]/[Applause] tags, extra whitespace)
- Tested successfully in Postman — returns videoId, transcript, wordCount

### ✅ Phase 2 — Chunking & Embeddings
- Built `chunking.js` — splits transcript into 500-char chunks with 50-char overlap
- Built `embeddings.js` — generates vector embeddings using `gemini-embedding-001` via `@google/genai`
- Built `/api/process` endpoint — chunks transcript and embeds each chunk
- Returns 97 chunks each with id, text, and 768-dimension embedding vector
- Tested successfully in Postman — 200 OK

## Setup
\`\`\`bash
cd backend
npm install
node index.js
\`\`\`

Create a `.env` file in `backend/`:
\`\`\`
PORT=5000
GEMINI_API_KEY=your_key_here
\`\`\`