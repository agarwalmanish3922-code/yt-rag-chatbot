const store = {};

function saveChunks(userId, videoId, chunks) {
  const key = `${userId}_${videoId}`;
  store[key] = chunks;
}

function getChunks(userId, videoId) {
  const key = `${userId}_${videoId}`;
  return store[key] || [];
}

function isProcessed(userId, videoId) {
  const key = `${userId}_${videoId}`;
  return !!store[key];
}

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

function similaritySearch(userId, videoId, questionEmbedding, topK = 3) {
  const chunks = getChunks(userId, videoId);
  if (chunks.length === 0) return [];

  const scored = chunks.map(chunk => ({
    id: chunk.id,
    text: chunk.text,
    score: cosineSimilarity(questionEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { saveChunks, getChunks, similaritySearch, isProcessed };