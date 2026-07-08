const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = [
  'gemini-2.0-flash-lite-001',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite'
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildCondensedTranscript(rawTranscript, totalDuration) {
  // Adaptive sampling — more samples for longer videos
  const targetSamples = 150; // always aim for ~150 sample points
  const interval = Math.max(30, Math.floor(totalDuration / targetSamples));
  
  const condensed = [];
  let lastTime = -interval;

  for (const item of rawTranscript) {
    if (item.offset - lastTime >= interval) {
      condensed.push(`[${formatTime(item.offset)}] ${item.text.trim()}`);
      lastTime = item.offset;
    }
  }

  return condensed.join('\n');
}

async function trimVideo(rawTranscript, videoId) {
  const totalDuration = rawTranscript[rawTranscript.length - 1]?.offset || 0;
  const totalMins = Math.floor(totalDuration / 60);

  console.log(`Video duration: ${formatTime(totalDuration)} (${totalDuration} seconds)`);

  const condensedText = buildCondensedTranscript(rawTranscript, totalDuration);
  
  console.log(`Condensed transcript: ${condensedText.split('\n').length} lines`);

  const prompt = `You are analyzing a YouTube educational video transcript to identify filler vs content segments.

VIDEO TOTAL DURATION: ${formatTime(totalDuration)} (${totalDuration} seconds)

TASK: Return time segments that contain ACTUAL EDUCATIONAL CONTENT worth watching.

SKIP these types of content (filler):
- Channel intros/outros (usually first 1-2 min and last 1-2 min)
- "Please subscribe/like/comment/share"
- Sponsor segments
- Self-promotion (courses, products, social media plugs)
- Excessive off-topic tangents
- Repeated recaps that add no new info

KEEP these types of content:
- Core topic explanations
- Code walkthroughs / demonstrations  
- Problem solving
- Examples and practice
- Q&A on the actual topic

IMPORTANT RULES:
1. Most lecture videos are 70-90% content — don't over-cut
2. Only remove clear, obvious filler segments
3. Keep segments at least 2-3 minutes long — don't create tiny fragments
4. If you're unsure, mark it as KEEP
5. The total content time should be between 60-95% of original for most lectures

Return ONLY a valid JSON array. No markdown, no explanation:
[
  { "start": 90, "end": 3600 },
  { "start": 3720, "end": 7200 }
]

Values are in seconds. Cover the full video — don't stop early.

TRANSCRIPT (sampled every ${Math.floor(totalDuration / 150)}s):
${condensedText}`;

  let segments = [];
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const text = response.text.trim();
      console.log(`Response preview:`, text.slice(0, 300));

      // Try to extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate segments
        if (parsed.length > 0 && parsed[0].start !== undefined && parsed[0].end !== undefined) {
          // Filter out invalid or tiny segments (less than 60 seconds)
          const validSegments = parsed.filter(seg => 
            seg.end > seg.start && 
            (seg.end - seg.start) >= 60 &&
            seg.start >= 0 &&
            seg.end <= totalDuration + 60
          );

          if (validSegments.length > 0) {
            // Check if result is reasonable (content should be 50-98% of original)
            const contentTime = validSegments.reduce((acc, seg) => acc + (seg.end - seg.start), 0);
            const contentPercent = (contentTime / totalDuration) * 100;
            
            console.log(`Content: ${formatTime(contentTime)} = ${contentPercent.toFixed(1)}% of original`);

            if (contentPercent >= 50 && contentPercent <= 98) {
              segments = validSegments;
              console.log(`✅ Valid result: ${segments.length} segments`);
              break;
            } else {
              console.log(`⚠️ Result rejected: ${contentPercent.toFixed(1)}% is outside 50-98% range`);
              // Still use it if it's the best we have
              segments = validSegments;
            }
          }
        }
      }
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status === 404 || err.status === 503) {
        console.log(`Model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      console.error(`Unexpected error with ${model}:`, err.message);
      continue;
    }
  }

  // Smart fallback — if no valid segments, use intelligent default
  if (segments.length === 0) {
    console.log('Using smart fallback — trimming intro/outro only');
    // Skip first 90 seconds (intro) and last 60 seconds (outro)
    const skipIntro = Math.min(90, totalDuration * 0.03);
    const skipOutro = Math.min(60, totalDuration * 0.02);
    segments = [{ 
      start: skipIntro, 
      end: totalDuration - skipOutro 
    }];
  }

  // Sort segments by start time
  segments.sort((a, b) => a.start - b.start);

  // Merge overlapping or very close segments (within 30 seconds of each other)
  const merged = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = segments[i];
    if (curr.start - prev.end <= 30) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push(curr);
    }
  }

  // Calculate stats
  const contentDuration = merged.reduce((acc, seg) => acc + (seg.end - seg.start), 0);
  const timeSaved = Math.max(0, totalDuration - contentDuration);

  const watchSegments = merged.map((seg, index) => ({
    index: index + 1,
    startTime: formatTime(seg.start),
    endTime: formatTime(seg.end),
    startSeconds: Math.floor(seg.start),
    endSeconds: Math.floor(seg.end),
    duration: formatTime(seg.end - seg.start),
    youtubeLink: `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seg.start)}s`
  }));

  return {
    totalDuration: formatTime(totalDuration),
    contentDuration: formatTime(contentDuration),
    timeSaved: formatTime(timeSaved),
    timeSavedPercent: Math.round((timeSaved / totalDuration) * 100),
    totalSegments: watchSegments.length,
    watchSegments
  };
}

module.exports = { trimVideo };