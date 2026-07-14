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

async function generateMCQs(transcript, count = 10) {
  const sampled = smartSample(transcript);

  const prompt = `You are an expert teacher creating multiple choice questions from a YouTube video transcript.

Create exactly ${count} high-quality MCQs based on the content.

Rules:
- Questions must be based strictly on the video content
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Options should be plausible and not obviously wrong
- Mix easy, medium, and hard questions
- Cover different topics from the video

Return ONLY valid JSON (no markdown, no backticks):
{
  "topic": "Main topic of the video",
  "mcqs": [
    {
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correct": "B",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

TRANSCRIPT:
${sampled}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.4,
    max_tokens: 3000
  });

  const text = completion.choices[0].message.content.trim();
  console.log('MCQ response preview:', text.slice(0, 200));

  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from MCQ response');

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`Generated ${parsed.mcqs?.length} MCQs`);
  return parsed;
}

module.exports = { generateMCQs };