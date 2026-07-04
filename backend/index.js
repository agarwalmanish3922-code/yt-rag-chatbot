const { chunkText } = require('./chunking');
const { getEmbedding } = require('./embeddings');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { saveChunks } = require('./vectorStore');
const { similaritySearch } = require('./vectorStore');
const { YoutubeTranscript } = require('youtube-transcript');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


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
  console.log("BODY =", req.body);
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  const videoId = getVideoId(url);
  if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

  try {
    const transcriptArr = await YoutubeTranscript.fetchTranscript(videoId);
    const cleanedText = cleanTranscript(transcriptArr);

    res.json({
      videoId,
      transcript: cleanedText,
      wordCount: cleanedText.split(' ').length
      });   
  } catch(err) {
    res.status(500).json({ error: 'Could not fetch transcript. Make sure the video has captions.'});
  }
});

app.post('/api/process', async (req, res) => {
  const { transcript, videoId } = req.body;

  if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

  try {
    const chunks = chunkText(transcript);

    const embeddedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i]);
      embeddedChunks.push({
        id: i,
        text: chunks[i],
        embedding
      });
    }

    // NEW LINE — save to memory after embedding
    saveChunks(videoId, embeddedChunks);
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

app.post('/api/search', async (req, res) => {
  const { videoId, question } = req.body;

  if (!videoId || !question) {
    return res.status(400).json({ error: 'videoId and question are required' });
  }

  try {
    // Convert question to embedding
    const questionEmbedding = await getEmbedding(question);

    // Find top 3 most relevant chunks
    const results = similaritySearch(videoId, questionEmbedding);

    res.json({
      question,
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/test', (req, res) => {
  console.log(req.body);
  res.json(req.body);
});

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));