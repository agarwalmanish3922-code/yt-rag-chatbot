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
- Tested successfully in Hoppscotch — returns videoId, transcript, wordCount

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