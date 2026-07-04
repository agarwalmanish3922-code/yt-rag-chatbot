// This is our in-memory database
// It's just a JavaScript object that holds chunks per videoId
const store = {};

// Save all chunks for a video
function saveChunks(videoId, chunks) {
  store[videoId] = chunks;
}

// Get all chunks for a video
function getChunks(videoId) {
  return store[videoId] || [];
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

// Find top K most similar chunks to a question embedding
function similaritySearch(videoId, questionEmbedding, topK = 3) {
  const chunks = getChunks(videoId);

  if (chunks.length === 0) return [];

  const scored = chunks.map(chunk => ({
    id: chunk.id,
    text: chunk.text,
    score: cosineSimilarity(questionEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

module.exports = { saveChunks, getChunks, similaritySearch };