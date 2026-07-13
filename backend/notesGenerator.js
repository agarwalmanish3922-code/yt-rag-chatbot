const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');
const PDFDocument = require('pdfkit');
const dotenv = require('dotenv');
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const geminiModels = [
  'gemini-2.0-flash-lite-001',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite'
];

// Smart sample for long videos
function smartSample(transcript) {
  if (transcript.length <= 30000) return transcript;

  const start  = transcript.slice(0, 12000);
  const middle = transcript.slice(
    Math.floor(transcript.length / 2) - 5000,
    Math.floor(transcript.length / 2) + 5000
  );
  const end = transcript.slice(-8000);

  return start + '\n[...middle of video...]\n' + middle + '\n[...end of video...]\n' + end;
}

// Notes prompt
function buildPrompt(transcript) {
  return `You are an expert college professor creating comprehensive study notes from a YouTube video transcript.

Create COMPLETE, DETAILED college-style study notes covering ALL topics in this transcript.

Rules:
- Cover every topic and subtopic discussed
- Use your knowledge to fill any gaps
- No duplicate sections
- Each section needs 4-6 detailed bullet points
- Include real examples from the transcript

Return ONLY valid JSON (no markdown, no backticks, no extra text):
{
  "chapterTitle": "Specific chapter or topic title",
  "subject": "Subject area",
  "sections": [
    {
      "title": "Section title",
      "content": [
        "Detailed point 1",
        "Detailed point 2",
        "Detailed point 3",
        "Detailed point 4"
      ],
      "keyFormulas": ["Formula: explanation"],
      "examples": ["Step by step example"]
    }
  ],
  "keyTerms": [
    {"term": "Term", "definition": "Definition"}
  ],
  "quickRevision": [
    "Point 1", "Point 2", "Point 3",
    "Point 4", "Point 5", "Point 6", "Point 7"
  ],
  "practiceQuestions": [
    "Question 1?", "Question 2?", "Question 3?",
    "Question 4?", "Question 5?"
  ]
}

TRANSCRIPT:
${transcript}`;
}

// Parse JSON from response
function parseJSON(text) {
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from response');
  return JSON.parse(jsonMatch[0]);
}

// Call Groq — for short videos
async function generateWithGroq(transcript) {
  console.log('Using Groq (llama-3.1-8b-instant)...');
  const prompt = buildPrompt(transcript);

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 0.3,
    max_tokens: 3000
  });

  const text = completion.choices[0].message.content.trim();
  console.log('Groq response preview:', text.slice(0, 150));
  const parsed = parseJSON(text);
  console.log(`Groq notes: ${parsed.sections?.length} sections`);
  return parsed;
}

// Call Gemini — for long videos
async function generateWithGemini(transcript) {
  console.log('Using Gemini for long video...');
  const sampled = smartSample(transcript);
  console.log(`Sampled: ${sampled.length} chars`);
  const prompt = buildPrompt(sampled);

  for (const model of geminiModels) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });
      const text = response.text.trim();
      console.log('Gemini response preview:', text.slice(0, 150));
      const parsed = parseJSON(text);
      console.log(`Gemini notes: ${parsed.sections?.length} sections`);
      return parsed;
    } catch (err) {
      if (err.status === 429 || err.status === 404 || err.status === 503) {
        console.log(`Gemini model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All Gemini models quota exceeded. Please try again later.');
}

// MAIN FUNCTION — hybrid approach
async function generateStructuredNotes(transcript) {
  console.log(`Transcript length: ${transcript.length} chars`);

  // Short video (under 10000 chars ~30 min) → Groq (fast, free)
  // Long video → Gemini (complete coverage with smart sampling)
  if (transcript.length <= 10000) {
    return await generateWithGroq(transcript);
  } else {
    return await generateWithGemini(transcript);
  }
}

// PDF GENERATION
function generatePDF(notes) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 55, right: 55 }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width - 110;

    const C = {
      headerBg:  '#1a1a2e',
      headerTxt: '#ffffff',
      headerSub: '#9090cc',
      accent:    '#5c5adb',
      sectionBg: '#2d2d5e',
      formulaBg: '#eeeeff',
      formulaTxt:'#3a3a8a',
      exTxt:     '#2d5a3d',
      termKey:   '#2d5a3d',
      bodyTxt:   '#222222',
      revBg:     '#f8f8ff',
      revBorder: '#ccccee',
      divider:   '#dddddd',
      bullet:    '#5c5adb',
      termBg:    '#1a3a2a',
      revHdrBg:  '#2a1a3a',
      qHdrBg:    '#2a1a1a',
    };

    // HEADER
    doc.rect(0, 0, doc.page.width, 100).fill(C.headerBg);
    doc.rect(0, 100, doc.page.width, 3).fill(C.accent);
    doc.fontSize(26).font('Helvetica-Bold').fillColor(C.headerTxt)
       .text('STUDY NOTES', 55, 22, { align: 'center', width: W });
    doc.fontSize(13).font('Helvetica').fillColor(C.headerSub)
       .text(notes.chapterTitle || 'Chapter Notes', 55, 56, { align: 'center', width: W });
    if (notes.subject) {
      doc.fontSize(9).fillColor('#7070aa')
         .text(`Subject: ${notes.subject}`, 55, 78, { align: 'center', width: W });
    }
    doc.y = 118;
    doc.moveDown(0.8);

    // HELPERS
    const checkNewPage = (minSpace = 150) => {
      if (doc.y > doc.page.height - minSpace) {
        doc.addPage();
        doc.y = 40;
      }
    };

    const sectionHeading = (label, bgColor) => {
      checkNewPage(180);
      const y = doc.y;
      doc.rect(55, y, W, 28).fill(bgColor || C.sectionBg);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.headerTxt)
         .text(label, 65, y + 8, { width: W - 20 });
      doc.y = y + 36;
    };

    const bulletPoint = (text) => {
      checkNewPage(80);
      const y = doc.y;
      doc.circle(64, y + 6, 2.5).fill(C.bullet);
      doc.fontSize(10.5).font('Helvetica').fillColor(C.bodyTxt)
         .text(text, 74, y, { width: W - 22, align: 'justify' });
      doc.moveDown(0.35);
    };

    const divider = () => {
      doc.moveDown(0.3);
      doc.rect(55, doc.y, W, 0.5).fill(C.divider);
      doc.moveDown(0.8);
    };

    // SECTIONS
    if (notes.sections && notes.sections.length > 0) {
      notes.sections.forEach((section, idx) => {
        sectionHeading(`${idx + 1}.  ${section.title.toUpperCase()}`);

        if (section.content && section.content.length > 0) {
          section.content.forEach(point => bulletPoint(point));
        }

        if (section.keyFormulas && section.keyFormulas.length > 0) {
          doc.moveDown(0.4);
          checkNewPage(100);
          const fy = doc.y;
          const fHeight = section.keyFormulas.length * 22 + 20;
          doc.rect(55, fy, W, fHeight).fill(C.formulaBg);
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accent)
             .text('KEY FORMULAS & CONCEPTS', 63, fy + 7, { width: W - 16 });
          let lineY = fy + 20;
          section.keyFormulas.forEach(f => {
            doc.fontSize(9.5).font('Helvetica-Oblique').fillColor(C.formulaTxt)
               .text(`  ->  ${f}`, 63, lineY, { width: W - 16 });
            lineY += 20;
          });
          doc.y = fy + fHeight + 6;
        }

        if (section.examples && section.examples.length > 0) {
          doc.moveDown(0.3);
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.exTxt)
             .text('EXAMPLES:', 60, doc.y, { width: W });
          doc.moveDown(0.2);
          section.examples.forEach((ex, i) => {
            checkNewPage(80);
            doc.fontSize(9.5).font('Helvetica').fillColor(C.exTxt)
               .text(`  Eg.${i + 1}  ${ex}`, 60, doc.y, { width: W - 10 });
            doc.moveDown(0.4);
          });
        }

        divider();
      });
    }

    // KEY TERMS
    if (notes.keyTerms && notes.keyTerms.length > 0) {
      sectionHeading('KEY TERMS & DEFINITIONS', C.termBg);
      notes.keyTerms.forEach(item => {
        checkNewPage(70);
        const y = doc.y;
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.termKey)
           .text(`${item.term}:  `, 60, y, { continued: true });
        doc.fontSize(10.5).font('Helvetica').fillColor(C.bodyTxt)
           .text(item.definition, { width: W - 10 });
        doc.moveDown(0.45);
      });
      divider();
    }

    // QUICK REVISION
    if (notes.quickRevision && notes.quickRevision.length > 0) {
      sectionHeading('QUICK REVISION POINTS', C.revHdrBg);
      const ry = doc.y;
      const rHeight = notes.quickRevision.length * 24 + 16;
      doc.rect(55, ry, W, rHeight).fill(C.revBg).stroke(C.revBorder);
      let lineY = ry + 10;
      notes.quickRevision.forEach(point => {
        if (lineY > doc.page.height - 60) { doc.addPage(); lineY = 40; }
        doc.fontSize(10.5).font('Helvetica').fillColor(C.bodyTxt)
           .text(`  [OK]  ${point}`, 62, lineY, { width: W - 14 });
        lineY += 24;
      });
      doc.y = ry + rHeight + 10;
      divider();
    }

    // PRACTICE QUESTIONS
    if (notes.practiceQuestions && notes.practiceQuestions.length > 0) {
      sectionHeading('PRACTICE QUESTIONS', C.qHdrBg);
      notes.practiceQuestions.forEach((q, i) => {
        checkNewPage(90);
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.bodyTxt)
           .text(`Q${i + 1}.  ${q}`, 60, doc.y, { width: W - 10 });
        doc.moveDown(0.4);
        doc.rect(60, doc.y, W - 10, 0.5).fill(C.divider);
        doc.moveDown(0.9);
        doc.rect(60, doc.y, W - 10, 0.5).fill(C.divider);
        doc.moveDown(1.1);
      });
    }

    // FOOTER
    const fy = doc.page.height - 40;
    doc.rect(0, fy - 8, doc.page.width, 48).fill(C.headerBg);
    doc.fontSize(8.5).font('Helvetica').fillColor('#6060aa')
       .text(
         'Generated by YouTube Learning Assistant  |  Learn smarter. Skip the fluff. Keep the knowledge.',
         55, fy + 2, { align: 'center', width: W }
       );

    doc.end();
  });
}

module.exports = { generateStructuredNotes, generatePDF };