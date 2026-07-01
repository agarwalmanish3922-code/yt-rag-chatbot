const dotenv = require('dotenv');
dotenv.config();

const { GoogleGenAI } = require('@google/genai');

console.log("KEY STARTS WITH:", process.env.GEMINI_API_KEY?.slice(0, 5));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [{ parts: [{ text: text }] }]
  });
  return response.embeddings[0].values;
}

module.exports = { getEmbedding };