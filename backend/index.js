const dotenv = require('dotenv');
dotenv.config();
// ═══ PROXY SETUP — must be first, before other requires ═══
if (process.env.PROXY_HOST) {
  process.env.GLOBAL_AGENT_HTTP_PROXY = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
  const { bootstrap } = require('global-agent');
  bootstrap();
  console.log('Proxy configured:', process.env.PROXY_HOST);
}
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const VideoHistory = require('./models/VideoHistory');
connectDB();


const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { getSubtitles } = require('youtube-caption-extractor');
const { chunkText } = require('./chunking');
const { getEmbedding } = require('./embeddings');
const { saveChunks, similaritySearch, isProcessed } = require('./vectorStore');
const { getHistory, addToHistory, clearHistory } = require('./memoryStore');
const { GoogleGenAI } = require('@google/genai');
const { trimVideo } = require('./trimmer');
const { generateAnswer, summarizeVideo, } = require('./chat');
const { generateStructuredNotes, generatePDF } = require('./notesGenerator');
const { generateMCQs } = require('./mcqGenerator');
const { generateInterviewQuestions } = require('./interviewGenerator');


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'https://yt-rag-chatbot-alpha.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/api/auth', authRoutes);


function getVideoId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

function cleanTranscript(transcriptArr) {
  return transcriptArr
    .map(chunk => chunk.text)
    .join(' ')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

app.post('/api/extract', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const videoId = getVideoId(url);
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

  // Try free method first (works fine on localhost, sometimes fails on cloud)
  try {
    const subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });

    if (subtitles && subtitles.length > 0) {
      const cleanedText = subtitles
        .map(item => item.text)
        .join(' ')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      const rawTranscript = subtitles.map(item => ({
        text: item.text,
        offset: Math.floor(parseFloat(item.start)),
        duration: Math.floor(parseFloat(item.dur))
      }));

      console.log('Transcript fetched via free method');
      return res.json({
        videoId,
        transcript: cleanedText,
        rawTranscript,
        wordCount: cleanedText.split(' ').length
      });
    }
  } catch (err) {
    console.log('Free method failed, falling back to Supadata:', err.message);
  }

  // Fallback — Supadata (reliable, works on cloud, handles IP blocking)
  try {
    const response = await axios.get('https://api.supadata.ai/v1/youtube/transcript', {
      params: { videoId },
      headers: { 'x-api-key': process.env.SUPADATA_API_KEY }
    });

    const content = response.data.content;

    if (!content || content.length === 0) {
      return res.status(400).json({ error: 'No captions found for this video.' });
    }

    const cleanedText = content
      .map(item => item.text)
      .join(' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const rawTranscript = content.map(item => ({
      text: item.text,
      offset: Math.floor(item.offset / 1000),
      duration: Math.floor(item.duration / 1000)
    }));

    console.log('Transcript fetched via Supadata');
    res.json({
      videoId,
      transcript: cleanedText,
      rawTranscript,
      wordCount: cleanedText.split(' ').length
    });

  } catch (err) {
    console.error('Supadata fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch transcript. Make sure the video has captions.' });
  }
});


app.post('/api/process', authMiddleware, async (req, res) => {
  const { transcript, videoId } = req.body;
  const userId = req.userId;

  if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

  if (isProcessed(userId, videoId)) {
    console.log(`Video ${videoId} already processed for user ${userId}, skipping...`);
    return res.json({
      videoId,
      totalChunks: 0,
      message: 'Video already processed',
      cached: true
    });
  }

  try {
    const chunks = chunkText(transcript);
    const embeddedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i]);
      embeddedChunks.push({ id: i, text: chunks[i], embedding });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    saveChunks(userId, videoId, embeddedChunks);
    res.json({
      videoId,
      totalChunks: embeddedChunks.length,
      message: 'Video processed and stored successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process transcript' });
  }
});

app.post('/api/search', authMiddleware, async (req, res) => {
  const { videoId, question } = req.body;
  const userId = req.userId;

  if (!videoId || !question) {
    return res.status(400).json({ error: 'videoId and question are required' });
  }

  try {
    const questionEmbedding = await getEmbedding(question);
    const results = similaritySearch(userId, videoId, questionEmbedding);
    res.json({ question, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/api/chat', authMiddleware, async (req, res) => {
  const { videoId, question } = req.body;
  const userId = req.userId;

  if (!videoId || !question) {
    return res.status(400).json({ error: 'videoId and question are required' });
  }

  try {
    const questionEmbedding = await getEmbedding(question);
    const relevantChunks = similaritySearch(userId, videoId, questionEmbedding, 3);

    if (relevantChunks.length === 0) {
      return res.status(404).json({ error: 'No content found for this video. Please process it first.' });
    }

    const history = getHistory(userId, videoId);
    const answer = await generateAnswer(question, relevantChunks, history);

    addToHistory(userId, videoId, 'user', question);
    addToHistory(userId, videoId, 'assistant', answer);

    await VideoHistory.findOneAndUpdate(
      { userId, videoId },
      {
        $push: {
          chatMessages: {
            $each: [
              { role: 'user', content: question, timestamp: new Date() },
              { role: 'assistant', content: answer, timestamp: new Date() }
            ]
          }
        }
      }
    );

    res.json({
      question,
      answer,
      sourceChunks: relevantChunks.map(c => ({ id: c.id, text: c.text, score: c.score }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

app.post('/api/clear-history', authMiddleware, (req, res) => {
  const { videoId } = req.body;
  const userId = req.userId;

  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  clearHistory(userId, videoId);
  res.json({ message: 'Conversation history cleared successfully' });
});

app.post('/api/summarize', authMiddleware, async (req, res) => {
  const { videoId, transcript } = req.body;
  const userId = req.userId;

  if (!videoId || !transcript) {
    return res.status(400).json({ error: 'videoId and transcript are required' });
  }

  try {
    const summary = await summarizeVideo(transcript);

    await VideoHistory.findOneAndUpdate(
      { userId, videoId },
      { summary }
    );

    res.json({ videoId, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to summarize video' });
  }
});

app.post('/api/notes', async (req, res) => {
  const { videoId, transcript } = req.body;

  if (!videoId || !transcript) {
    return res.status(400).json({ error: 'videoId and transcript are required' });
  }

  try {
    console.log(`Transcript length: ${transcript.length}`);
    const structuredNotes = await generateStructuredNotes(transcript);
    console.log('Structured notes:', JSON.stringify(structuredNotes, null, 2).slice(0, 500));
    const pdfBuffer = await generatePDF(structuredNotes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="study-notes-${videoId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Notes error:', err.message);
    res.status(500).json({ error: 'Failed to generate notes: ' + err.message });
  }
});

app.post('/api/mcq', authMiddleware, async (req, res) => {
  const { videoId, transcript } = req.body;
  const userId = req.userId;

  if (!videoId || !transcript) {
    return res.status(400).json({ error: 'videoId and transcript are required' });
  }

  try {
    const result = await generateMCQs(transcript);

    await VideoHistory.findOneAndUpdate(
      { userId, videoId },
      { mcqs: result }
    );

    res.json({ videoId, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate MCQs: ' + err.message });
  }
});

app.post('/api/interview', authMiddleware, async (req, res) => {
  const { videoId, transcript } = req.body;
  const userId = req.userId;

  if (!videoId || !transcript) {
    return res.status(400).json({ error: 'videoId and transcript are required' });
  }

  try {
    const result = await generateInterviewQuestions(transcript);

    await VideoHistory.findOneAndUpdate(
      { userId, videoId },
      { interviewQuestions: result }
    );

    res.json({ videoId, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate interview questions: ' + err.message });
  }
});

app.post('/api/trim', authMiddleware, async (req, res) => {
  const { videoId, rawTranscript } = req.body;
  const userId = req.userId;

  if (!videoId || !rawTranscript) {
    return res.status(400).json({ error: 'videoId and rawTranscript are required' });
  }

  try {
    const result = await trimVideo(rawTranscript, videoId);

    await VideoHistory.findOneAndUpdate(
      { userId, videoId },
      { trimResult: result }
    );

    res.json({ videoId, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to trim video' });
  }
});

// Save video to user's history (protected route)
app.post('/api/history/save', authMiddleware, async (req, res) => {
  const { videoId, title, url, transcript } = req.body;

  try {
    const existing = await VideoHistory.findOne({ userId: req.userId, videoId });
    if (existing) {
      return res.json({ message: 'Already in history' });
    }

    await VideoHistory.create({
      userId: req.userId,
      videoId,
      title,
      url,
      transcript
    });

    res.json({ message: 'Saved to history' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// Get user's video history (protected route)
app.get('/api/history/list', authMiddleware, async (req, res) => {
  try {
    const history = await VideoHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get full cached data for a specific video (protected route)
app.get('/api/history/:videoId', authMiddleware, async (req, res) => {
  try {
    const record = await VideoHistory.findOne({
      userId: req.userId,
      videoId: req.params.videoId
    });

    if (!record) {
      return res.status(404).json({ error: 'No history found for this video' });
    }

    res.json({ history: record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video history' });
  }
});


const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));