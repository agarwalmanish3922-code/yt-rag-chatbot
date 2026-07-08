function chunkText(text, chunkSize = 1000, overlap = 100,maxChunks=50) {
  const chunks = [];
  let start = 0;

  while (start < text.length && chunks.length <maxChunks) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start = end - overlap;
  }

  return chunks;
}

module.exports = { chunkText };