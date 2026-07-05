const dotenv = require('dotenv');
dotenv.config();

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  'gemini-2.0-flash-lite-001',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest'
];

async function generateAnswer(question, relevantChunks, history) {
  // Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, index) => `Context ${index + 1}:\n${chunk.text}`)
    .join('\n\n');

  // Build conversation history string
  const historyText = history.length > 0
    ? history
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')
    : 'No previous conversation.';

  // Build the RAG prompt with memory
  const prompt = `You are a helpful assistant that answers questions about YouTube videos.

Answer the question using ONLY the provided context from the video transcript.
If the answer is not found in the context, say "I couldn't find that information in the video."
Do not make up any information.
Use the conversation history to understand follow-up questions and references like "it", "that", "this".

--- VIDEO CONTEXT ---
${context}

--- CONVERSATION HISTORY ---
${historyText}

--- CURRENT QUESTION ---
User: ${question}

Answer:`;

  // Try each model until one works
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return response.text;
    } catch (err) {
      if (err.status === 429 || err.status===404) {
        console.log(`Model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('All models quota exceeded. Please wait a few minutes and try again.');
}

module.exports = { generateAnswer };