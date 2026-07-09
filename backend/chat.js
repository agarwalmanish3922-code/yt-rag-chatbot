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

async function summarizeVideo(transcript) {
  const prompt = `You are an expert at summarizing educational YouTube videos.

Given the following video transcript, create a clear and structured summary.

Format your response exactly like this:

🎯 MAIN TOPIC
[One sentence describing what this video is about]

📌 KEY POINTS
[5-8 bullet points covering the most important concepts]

💡 KEY TAKEAWAYS
[3-5 practical takeaways the viewer should remember]

🔑 IMPORTANT TERMS
[List any important terms or concepts mentioned with brief definitions]

Keep the summary concise, educational, and easy to understand.

TRANSCRIPT:
${transcript.slice(0, 8000)}`;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return response.text;
    } catch (err) {
      if (err.status === 429 || err.status === 404) {
        console.log(`Model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('All models quota exceeded. Please wait a few minutes.');
}

async function generateNotes(transcript) {
  const prompt = `You are an expert note-taker for students. Create detailed, well-structured study notes from this YouTube video transcript.

Format the notes exactly like this:

📚 TOPIC: [Main topic of the video]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 SECTION 1: [First major topic]
- [Key point 1]
- [Key point 2]
- [Key point 3]
💡 Important: [Any crucial insight from this section]

📖 SECTION 2: [Second major topic]
- [Key point 1]
- [Key point 2]
- [Key point 3]
💡 Important: [Any crucial insight from this section]

[Continue for all major sections...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 KEY TERMS & DEFINITIONS:
- [Term 1]: [Definition]
- [Term 2]: [Definition]
- [Term 3]: [Definition]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ QUICK REVISION POINTS:
- [Most important thing to remember 1]
- [Most important thing to remember 2]
- [Most important thing to remember 3]
- [Most important thing to remember 4]
- [Most important thing to remember 5]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Make the notes comprehensive, detailed and useful for exam revision.
Cover ALL major topics discussed in the video.
Use simple, clear language.

TRANSCRIPT:
${transcript.slice(0, 10000)}`;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      return response.text;
    } catch (err) {
      if (err.status === 429 || err.status === 404 || err.status === 503) {
        console.log(`Model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All models quota exceeded. Please wait a few minutes.');
}

module.exports = { generateAnswer, summarizeVideo, generateNotes };