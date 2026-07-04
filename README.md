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

### ✅ Phase 2 — Chunking & Embeddings
- Built `chunking.js` — splits transcript into 500-char chunks with 50-char overlap
- Built `embeddings.js` — generates vector embeddings using `gemini-embedding-001` via `@google/genai`
- Built `/api/process` endpoint — chunks transcript and embeds each chunk
- Returns chunks each with id, text, and embedding vector
- Tested successfully in Hoppscotch — 200 OK

### ✅ Phase 3 — Vector Storage & Similarity Search
- Built `vectorStore.js` — in-memory vector store with cosine similarity
- Updated `/api/process` to save embedded chunks to memory
- Built `/api/search` endpoint — converts question to embedding, returns top 3 relevant chunks with similarity scores
- Tested successfully — returns ranked chunks with scores in ~1.3 seconds

### ✅ Phase 4 — RAG Answer Generation
- Built `chat.js` — sends relevant chunks + question to Gemini as a structured RAG prompt
- Built `/api/chat` endpoint — full RAG pipeline: embed → search → answer
- Answer strictly grounded in video transcript context
- Response includes answer + source chunks with similarity scores
- Note: uses gemini-2.0-flash-lite-001 model via @google/genai SDK

### ✅ Phase 5 — Chat Memory
- Built `memoryStore.js` — stores conversation history per video in memory
- Updated `chat.js` — includes conversation history in every Gemini prompt
- Updated `/api/chat` — saves each Q&A pair to history after responding
- Added `/api/clear-history` endpoint — resets conversation for fresh start
- Gemini can now understand follow-up questions and references like "it", "that"

## Setup

```bash
cd backend
npm install
node index.js
```

Create a `.env` file in `backend/`:

```
PORT=5000
GEMINI_API_KEY=your_key_here
```