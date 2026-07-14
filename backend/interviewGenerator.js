const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function smartSample(transcript) {
  if (transcript.length <= 8000) return transcript;

  const start  = transcript.slice(0, 3000);
  const middle = transcript.slice(
    Math.floor(transcript.length / 2) - 1500,
    Math.floor(transcript.length / 2) + 1500
  );
  const end = transcript.slice(-2000);

  return start + '\n[...]\n' + middle + '\n[...]\n' + end;
}

async function generateInterviewQuestions(transcript) {
  const sampled = smartSample(transcript);

  const prompt = `You are a senior technical interviewer preparing candidates based on a YouTube educational video transcript.

Create interview questions based on the topics covered in this video.

Rules:
- Generate 3 questions for Basic level
- Generate 3 questions for Intermediate level
- Generate 2 questions for Advanced level
- Each question needs a short tip on how to answer well
- Questions should be realistic — the kind actually asked in technical interviews
- Base questions strictly on the video's topic

Return ONLY valid JSON (no markdown, no backticks):
{
  "topic": "Main topic of the video",
  "basic": [
    {
      "question": "Question text?",
      "tip": "Short tip on how to answer this well"
    }
  ],
  "intermediate": [
    {
      "question": "Question text?",
      "tip": "Short tip on how to answer this well"
    }
  ],
  "advanced": [
    {
      "question": "Question text?",
      "tip": "Short tip on how to answer this well"
    }
  ]
}

TRANSCRIPT:
${sampled}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    max_tokens: 2500
  });

  const text = completion.choices[0].message.content.trim();
  console.log('Interview Qs preview:', text.slice(0, 200));

  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from interview response');

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`Generated: ${parsed.basic?.length} basic, ${parsed.intermediate?.length} intermediate, ${parsed.advanced?.length} advanced`);
  return parsed;
}

module.exports = { generateInterviewQuestions };