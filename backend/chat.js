const dotenv = require('dotenv');
dotenv.config();

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateAnswer(question, relevantChunks) {
  // Build context string from relevant chunks
  const context = relevantChunks
    .map((chunk, index) => `Context ${index + 1}:\n${chunk.text}`)
    .join('\n\n');

  // Build the RAG prompt
  const prompt = `You are a helpful assistant that answers questions about YouTube videos.

You will be given some context extracted from a video transcript and a question from the user.
Answer the question using ONLY the provided context.
If the answer is not found in the context, say "I couldn't find that information in the video."
Do not make up any information.

${context}

Question: ${question}

Answer:`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-lite-001',
    contents: prompt
  });

  return response.text;
}

module.exports = { generateAnswer };