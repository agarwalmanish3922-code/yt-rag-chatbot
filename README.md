<div align="center">

# 🎬 YouTube Learning Assistant

### *Learn smarter. Skip the fluff. Keep the knowledge.*

An AI-powered full-stack platform that turns any YouTube video into an interactive learning experience — chat with videos, generate study notes, test yourself with MCQs, prep for interviews, and skip the unnecessary parts to save hours of study time.

🔗 **[Live Demo](https://yt-rag-chatbot-alpha.vercel.app/)**  •  📂 **[GitHub Repo](https://github.com/agarwalmanish3922-code/yt-rag-chatbot)**

![Status](https://img.shields.io/badge/status-live-success)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google&logoColor=white)
![Groq](https://img.shields.io/badge/AI-Groq_Llama-F55036)
![Deployed](https://img.shields.io/badge/Deployed-Railway_%2B_Vercel-0B0D0E)

</div>

---

## ✨ What is this?

Most YouTube RAG chatbots just answer questions. This one does more — it's a complete **AI study companion** that:

- 💬 Lets you **chat** with any YouTube video like it's a knowledgeable tutor
- 📝 Generates **structured summaries** in seconds
- 📚 Creates **college-style PDF notes** — chapter titles, key terms, formulas, revision points
- ❓ Builds an **interactive MCQ quiz** with instant scoring
- 💼 Prepares **interview questions** at Basic/Intermediate/Advanced levels
- ✂️ Analyzes transcripts to **skip filler content** — intros, sponsors, subscribe-reminders
- 🔐 Supports **real user accounts** — your history, your data, isolated and secure
- 🎬 Handles **multiple videos** — switch instantly without reprocessing

> Built as a solo project from scratch — architecture, prompts, RAG pipeline, database, auth, and deployment — all hand-engineered and iterated phase by phase.

---

## 🖥️ Try It Live

<div align="center">

### 👉 [**yt-rag-chatbot-alpha.vercel.app**](https://yt-rag-chatbot-alpha.vercel.app/) 👈

*Backend on Railway • Frontend on Vercel • Database on MongoDB Atlas*

</div>

> ⚠️ **Known limitation:** YouTube occasionally blocks transcript requests coming from cloud server IPs — a common issue for any YouTube-transcript tool hosted on cloud platforms (Railway, Render, AWS, etc.). All features work reliably when run locally. A residential proxy solution is in progress to resolve this for the live deployment.

---

## 🧠 How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Paste YouTube   │ ──▶ │  Extract & Clean  │ ──▶ │  Chunk + Embed     │
│      URL         │     │    Transcript     │     │  (Gemini Vectors)  │
└─────────────────┘     └──────────────────┘     └───────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Ask a Question   │ ◀── │  Cosine Similarity │ ◀── │  In-Memory Vector  │
│                   │     │      Search        │     │      Store         │
└─────────────────┘     └──────────────────┘     └───────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│   Gemini LLM generates an answer strictly from video context  │
│           + remembers conversation history for follow-ups      │
└─────────────────────────────────────────────────────────────┘
```

Plus dedicated pipelines for **Summarization**, **Smart Trimming**, **Notes (PDF)**, **MCQs**, and **Interview Prep** — each with its own prompt engineering and multi-model fallback logic.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, custom CSS (glassmorphism + animations) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT + bcryptjs |
| **LLM — Chat / Trim / Summary** | Google Gemini API (multi-model fallback) |
| **LLM — Notes / MCQ / Interview** | Groq API (Llama 3.1 8B Instant) |
| **Embeddings** | Gemini Embedding Model |
| **Vector Search** | In-memory Cosine Similarity (per-user isolated) |
| **PDF Generation** | PDFKit |
| **Transcript Source** | youtube-caption-extractor (npm) |
| **Hosting** | Railway (backend) + Vercel (frontend) |

---

## 📦 Features

| Feature | Status |
|---|:---:|
| User authentication (signup/login/logout) | ✅ |
| YouTube transcript extraction | ✅ |
| Smart chunking + vector embeddings | ✅ |
| Cosine similarity search | ✅ |
| RAG-based chat with memory | ✅ |
| Modern animated React UI | ✅ |
| Video summarization | ✅ |
| College-style PDF notes generation | ✅ |
| Interactive MCQ quiz + scoring | ✅ |
| Interview question generator | ✅ |
| Multi-video support | ✅ |
| Per-user data isolation | ✅ |
| **Live deployment** | ✅ |
| Smart Video Trimmer | 🔧 *in progress* |
| Reliable proxy for live transcript fetch | 🔧 *in progress* |
| Professional frontend redesign | 🔲 *planned* |

---

## 📁 Project Structure

```
yt-rag-chatbot/
├── backend/
│   ├── index.js              # Express server & API routes
│   ├── db.js                 # MongoDB connection (Windows DNS fix)
│   ├── chunking.js           # Transcript chunking logic
│   ├── embeddings.js         # Gemini embedding generation
│   ├── vectorStore.js        # Per-user in-memory vector store
│   ├── memoryStore.js        # Per-user conversation history
│   ├── chat.js               # RAG prompt + answer generation
│   ├── trimmer.js            # Smart Video Trimmer
│   ├── notesGenerator.js     # PDF notes (Groq + Gemini hybrid)
│   ├── mcqGenerator.js       # MCQ generation
│   ├── interviewGenerator.js # Interview question generation
│   ├── models/
│   │   ├── User.js
│   │   └── VideoHistory.js
│   ├── middleware/
│   │   └── auth.js           # JWT verification
│   └── routes/
│       └── auth.js           # Signup / Login / Me
├── frontend/
│   └── src/
│       ├── App.js
│       ├── App.css
│       ├── Auth.js
│       └── AuthContext.js
└── README.md
```

---

## ⚙️ Run It Locally

```bash
# 1. Clone the repo
git clone https://github.com/agarwalmanish3922-code/yt-rag-chatbot.git

# 2. Backend setup
cd yt-rag-chatbot/backend
npm install
node index.js

# 3. Frontend setup (new terminal)
cd yt-rag-chatbot/frontend
npm install
npm start
```

Create `backend/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key

# Optional — proxy for bypassing YouTube IP blocks in cloud environments
PROXY_HOST=your_proxy_ip
PROXY_PORT=your_proxy_port
PROXY_USERNAME=your_proxy_username
PROXY_PASSWORD=your_proxy_password
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/signup` | — | Create account |
| `POST` | `/api/auth/login` | — | Login, get JWT |
| `GET` | `/api/auth/me` | ✅ | Current user |
| `POST` | `/api/extract` | — | Get transcript from URL |
| `POST` | `/api/process` | ✅ | Chunk + embed transcript |
| `POST` | `/api/chat` | ✅ | RAG Q&A |
| `POST` | `/api/clear-history` | ✅ | Reset chat memory |
| `POST` | `/api/summarize` | — | Generate summary |
| `POST` | `/api/trim` | — | Smart trim segments |
| `POST` | `/api/notes` | — | Generate PDF notes |
| `POST` | `/api/mcq` | — | Generate MCQ quiz |
| `POST` | `/api/interview` | — | Generate interview Qs |
| `POST` | `/api/history/save` | ✅ | Save video to history |
| `GET` | `/api/history/list` | ✅ | Get user's history |

---

## 📈 Build Journal — Phase by Phase

<details>
<summary><b>✅ Phase 1 — Transcript Extraction</b></summary>

- `/api/extract` endpoint extracts video ID from any YouTube URL format
- Fetches & cleans transcript with timestamps for the Smart Trimmer
</details>

<details>
<summary><b>✅ Phase 2 — Chunking & Embeddings</b></summary>

- 1000-char chunks with 100-char overlap
- Gemini `gemini-embedding-001` for vector generation
- Rate-limited with delays, capped at 50 chunks/video
- Skips re-embedding already-processed videos
</details>

<details>
<summary><b>✅ Phase 3 — Vector Storage & Similarity Search</b></summary>

- Custom in-memory cosine similarity engine, per-user isolated
- Returns top-3 most relevant chunks per query
</details>

<details>
<summary><b>✅ Phase 4 — RAG Answer Generation</b></summary>

- Structured prompt grounds answers strictly in video content
- Multi-model fallback across 6 Gemini models for quota resilience
</details>

<details>
<summary><b>✅ Phase 5 — Chat Memory</b></summary>

- Per-video conversation history enables natural follow-up questions
</details>

<details>
<summary><b>✅ Phase 6 — React Frontend</b></summary>

- Glassmorphism dark UI, animated particles, gradient orbs
- Loading animations, typing indicators, responsive design
</details>

<details>
<summary><b>✅ Phase 7 — Video Summarization</b></summary>

- One-click structured summary: Topic, Key Points, Takeaways, Terms
</details>

<details>
<summary><b>🔧 Phase 8 — Smart Video Trimmer</b></summary>

- Single-call adaptive sampling (~150 points) identifies filler vs content
- ⚠️ Accuracy improvements ongoing — transcript-only analysis has natural limits
</details>

<details>
<summary><b>✅ Phase 9 — Smart PDF Notes Generation</b></summary>

- Hybrid engine: Groq for short videos, Gemini for long ones
- College-style PDF — sections, formulas, examples, key terms, revision points
</details>

<details>
<summary><b>✅ Phase 10 — MCQ Generation</b></summary>

- Interactive quiz with instant scoring, explanations, retake option
</details>

<details>
<summary><b>✅ Phase 11 — Interview Questions Generator</b></summary>

- Basic / Intermediate / Advanced tiers with answering tips
</details>

<details>
<summary><b>✅ Phase 12 — Multi-video Support</b></summary>

- Switch between recent videos instantly, no re-processing
</details>

<details>
<summary><b>✅ Phase 13 — User Authentication</b></summary>

- MongoDB + JWT + bcrypt — full signup/login system
- Complete per-user data isolation across chat, embeddings & history
</details>

<details>
<summary><b>✅ Phase 14 — Deployment</b></summary>

- Backend live on Railway, frontend live on Vercel
- MongoDB Atlas in production, CORS locked to frontend domain
- Switched from `youtube-transcript` to `youtube-caption-extractor` after upstream package broke
- Added proxy support (`global-agent`) to route around YouTube's cloud-IP blocking — partially resolved, ongoing work with residential proxies
</details>

</details>

---

## 🗺️ What's Next

- 🔲 **Phase 15** — Reliable residential proxy for live transcript fetching
- 🔲 **Phase 16** — Fix Smart Trim accuracy
- 🔲 **Phase 17** — Professional frontend redesign
- 🔲 **Phase 18** — Final polish & demo video

---

## 🤝 About the Author

**Manish Agarwal**  
Full-Stack Developer & AI Application Builder

Built this entire project — architecture, prompts, backend, frontend, database, auth, and deployment — from scratch as a solo builder, iterating through 14+ phases.

[GitHub](https://github.com/agarwalmanish3922-code)

---

<div align="center">

**⭐ If you found this project interesting, consider giving it a star!**

</div>