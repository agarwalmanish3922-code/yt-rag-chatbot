const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const PDFDocument = require('pdfkit');
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

async function callGemini(prompt) {
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      return response.text.trim();
    } catch (err) {
      if (err.status === 429 || err.status === 404 || err.status === 503) {
        console.log(`Model ${model} failed (${err.status}), trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All models quota exceeded');
}

// SINGLE API CALL for short/medium videos (under 30000 chars)
async function generateInSingleCall(transcript) {
  console.log('Using single call approach...');

  const prompt = `You are an expert college professor creating comprehensive study notes from a YouTube video transcript.

Create COMPLETE, DETAILED college-style study notes covering ALL topics in this transcript.

Rules:
- Cover every topic and subtopic discussed in the video
- Use your knowledge to fill any gaps or incomplete explanations
- No duplicate sections
- Each section needs 4-6 detailed bullet points
- Include real examples from the transcript
- Be thorough and detailed

Return ONLY valid JSON (no markdown, no extra text, no backticks):
{
  "chapterTitle": "Specific chapter or topic title",
  "subject": "Subject area like Data Structures, Python etc",
  "sections": [
    {
      "title": "Section title",
      "content": [
        "Detailed explanation point 1",
        "Detailed explanation point 2",
        "Detailed explanation point 3",
        "Detailed explanation point 4"
      ],
      "keyFormulas": [
        "Formula name: formula and explanation"
      ],
      "examples": [
        "Step by step example from the video"
      ]
    }
  ],
  "keyTerms": [
    {
      "term": "Term name",
      "definition": "Clear concise definition"
    }
  ],
  "quickRevision": [
    "Most important point 1",
    "Most important point 2",
    "Most important point 3",
    "Most important point 4",
    "Most important point 5",
    "Most important point 6",
    "Most important point 7"
  ],
  "practiceQuestions": [
    "Exam style question 1?",
    "Exam style question 2?",
    "Exam style question 3?",
    "Exam style question 4?",
    "Exam style question 5?"
  ]
}

TRANSCRIPT:
${transcript}`;

  const text = await callGemini(prompt);
  console.log('Raw Gemini response (first 500 chars):', text.slice(0, 500));

  // Clean response — remove any markdown formatting
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error('Could not extract JSON from response');

  const parsed = JSON.parse(jsonMatch[0]);
  console.log(`Generated: ${parsed.sections?.length} sections`);
  return parsed;
}

// CHUNKED APPROACH for long videos (over 30000 chars)
async function generateInChunks(transcript) {
  console.log('Using chunked approach for long video...');

  // Take first 30000 chars, middle 10000, last 10000
  // This gives coverage without too many API calls
  const parts = [];

  if (transcript.length <= 50000) {
    // Split into 2 parts
    parts.push(transcript.slice(0, 25000));
    parts.push(transcript.slice(25000));
  } else {
    // Take strategic samples: beginning, middle, end
    const third = Math.floor(transcript.length / 3);
    parts.push(transcript.slice(0, 20000));           // first 20k
    parts.push(transcript.slice(third, third + 15000)); // middle 15k
    parts.push(transcript.slice(-15000));              // last 15k
  }

  console.log(`Processing ${parts.length} parts...`);

  // Generate notes for each part
  const allSections = [];
  const allKeyTerms = [];
  const seenSections = new Set();
  const seenTerms = new Set();
  let chapterTitle = '';
  let subject = '';

  for (let i = 0; i < parts.length; i++) {
    console.log(`Processing part ${i + 1}/${parts.length}...`);

    const prompt = `You are an expert college professor. Create study notes from this transcript part ${i + 1} of ${parts.length}.

Return ONLY valid JSON:
{
  "chapterTitle": "Chapter title (only fill if part 1)",
  "subject": "Subject area (only fill if part 1)",
  "sections": [
    {
      "title": "Unique section title",
      "content": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "keyFormulas": ["Formula: explanation"],
      "examples": ["Example with steps"]
    }
  ],
  "keyTerms": [
    {"term": "Term", "definition": "Definition"}
  ]
}

TRANSCRIPT PART:
${parts[i]}`;

    try {
      const text = await callGemini(prompt);
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (i === 0) {
          chapterTitle = parsed.chapterTitle || '';
          subject = parsed.subject || '';
        }

        // Add unique sections
        if (parsed.sections) {
          parsed.sections.forEach(section => {
            const key = section.title.toLowerCase().substring(0, 25);
            if (!seenSections.has(key)) {
              seenSections.add(key);
              allSections.push(section);
            }
          });
        }

        // Add unique key terms
        if (parsed.keyTerms) {
          parsed.keyTerms.forEach(item => {
            const key = item.term.toLowerCase();
            if (!seenTerms.has(key)) {
              seenTerms.add(key);
              allKeyTerms.push(item);
            }
          });
        }
      }
    } catch (e) {
      console.log(`Part ${i + 1} failed: ${e.message}`);
    }

    // Small delay between parts
    if (i < parts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  // Generate revision points from all sections
  const sectionSummary = allSections.slice(0, 6)
    .map(s => `${s.title}: ${s.content[0]}`)
    .join('\n');

  const revPrompt = `Based on these notes about "${subject}", generate quick revision points and practice questions.

Return ONLY valid JSON:
{
  "quickRevision": ["Point 1","Point 2","Point 3","Point 4","Point 5","Point 6","Point 7"],
  "practiceQuestions": ["Question 1?","Question 2?","Question 3?","Question 4?","Question 5?"]
}

SECTIONS:
${sectionSummary}`;

  let quickRevision = [];
  let practiceQuestions = [];

  try {
    const revText = await callGemini(revPrompt);
    const cleaned = revText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      quickRevision = parsed.quickRevision || [];
      practiceQuestions = parsed.practiceQuestions || [];
    }
  } catch (e) {
    console.log('Revision generation failed, using defaults');
  }

  return {
    chapterTitle,
    subject,
    sections: allSections,
    keyTerms: allKeyTerms,
    quickRevision,
    practiceQuestions
  };
}

// MAIN FUNCTION — hybrid approach
function smartSample(transcript) {
  if (transcript.length <= 30000) {
    return transcript;
  }

  const start  = transcript.slice(0, 12000);
  const middle = transcript.slice(
    Math.floor(transcript.length / 2) - 5000,
    Math.floor(transcript.length / 2) + 5000
  );
  const end = transcript.slice(-8000);

  return start + '\n[...middle of video...]\n' + middle + '\n[...end of video...]\n' + end;
}

async function generateStructuredNotes(transcript) {
  console.log(`Full transcript: ${transcript.length} chars`);

  const sampled = smartSample(transcript);
  console.log(`Sampled transcript: ${sampled.length} chars`);
  console.log('Using single API call approach...');

  return await generateInSingleCall(sampled);
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

    // ── HEADER ──────────────────────────────────────────
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

    // ── HELPERS ─────────────────────────────────────────
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

    // ── SECTIONS ────────────────────────────────────────
    if (notes.sections && notes.sections.length > 0) {
      notes.sections.forEach((section, idx) => {

        sectionHeading(`${idx + 1}.  ${section.title.toUpperCase()}`);

        // Content
        if (section.content && section.content.length > 0) {
          section.content.forEach(point => bulletPoint(point));
        }

        // Key Formulas
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

        // Examples
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

    // ── KEY TERMS ───────────────────────────────────────
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

    // ── QUICK REVISION ──────────────────────────────────
    if (notes.quickRevision && notes.quickRevision.length > 0) {
      sectionHeading('QUICK REVISION POINTS', C.revHdrBg);

      const ry = doc.y;
      const rHeight = notes.quickRevision.length * 24 + 16;
      doc.rect(55, ry, W, rHeight).fill(C.revBg).stroke(C.revBorder);

      let lineY = ry + 10;
      notes.quickRevision.forEach(point => {
        if (lineY > doc.page.height - 60) {
          doc.addPage();
          lineY = 40;
        }
        doc.fontSize(10.5).font('Helvetica').fillColor(C.bodyTxt)
           .text(`  [OK]  ${point}`, 62, lineY, { width: W - 14 });
        lineY += 24;
      });

      doc.y = ry + rHeight + 10;
      divider();
    }

    // ── PRACTICE QUESTIONS ──────────────────────────────
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

    // ── FOOTER ──────────────────────────────────────────
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