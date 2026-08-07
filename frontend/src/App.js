import { useAuth } from './AuthContext';
import Auth from './Auth';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000' 
  : 'https://yt-rag-chatbot-production-7bdd.up.railway.app';

function App() {
  const { token, user, loading, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState([]);

  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [trimResult, setTrimResult] = useState(null);
  const [isTrimming, setIsTrimming] = useState(false);

  const [notesReady, setNotesReady] = useState(false);
  const [notesBlobUrl, setNotesBlobUrl] = useState('');
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);

  const [mcqs, setMcqs] = useState(null);
  const [isGeneratingMcqs, setIsGeneratingMcqs] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const [interviewQs, setInterviewQs] = useState(null);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);

  const [videoHistory, setVideoHistory] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE}/api/history/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setVideoHistory(res.data.history))
      .catch(() => setVideoHistory([]));
    }
  }, [token]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  if (loading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const resetAllTools = () => {
    setSummary('');
    setTrimResult(null);
    setNotesReady(false);
    setNotesBlobUrl('');
    setMcqs(null);
    setUserAnswers({});
    setShowResults(false);
    setInterviewQs(null);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError('');
      // Check if this URL is already in history — reuse instead of re-extracting
    const existingVideo = videoHistory.find(v => v.url === url.trim());
    if (existingVideo) {
      console.log('Video already in history, reusing cached data');
      await handleSwitchVideo(existingVideo);
      return;
    }
    setIsProcessing(true);
    setStage('extracting');
    setMessages([]);
    resetAllTools();

    try {
      const extractRes = await axios.post(`${API_BASE}/api/extract`, { url });
      const { videoId: vid, transcript, rawTranscript } = extractRes.data;
      const title = `Video: ${vid}`;

      setVideoId(vid);
      setVideoTitle(title);
      setTranscript(transcript);
      setRawTranscript(rawTranscript);
      setStage('processing');

      await axios.post(`${API_BASE}/api/process`, {
        videoId: vid,
        transcript
      }, {
      headers: { Authorization: `Bearer ${token}` }
    });

      setStage('ready');
      setMessages([{
        role: 'assistant',
        content: '✅ Video analyzed successfully! I\'ve read through the entire transcript. Ask me anything about this video.',
        timestamp: new Date()
      }]);

      // Save to MongoDB history (per logged-in user)
      try {
        await axios.post(`${API_BASE}/api/history/save`,
          { videoId: vid, title, url, transcript },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const historyRes = await axios.get(`${API_BASE}/api/history/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVideoHistory(historyRes.data.history);
      } catch (err) {
        console.log('History save failed, continuing anyway');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setStage('idle');
    } finally {
      setIsProcessing(false);
    }
  };

const handleSwitchVideo = async (historyItem) => {
  if (historyItem.videoId === videoId) return;

  setError('');
  resetAllTools();
  setMessages([]);
  setUrl(historyItem.url);
  setVideoId(historyItem.videoId);
  setVideoTitle(historyItem.title);
  setTranscript(historyItem.transcript);
  setRawTranscript(historyItem.rawTranscript);
  setStage('processing');
  setIsProcessing(true);

  try {
    // Ensure embeddings exist (instant if already processed)
    await axios.post(`${API_BASE}/api/process`, {
      videoId: historyItem.videoId,
      transcript: historyItem.transcript
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Fetch cached results (summary, mcqs, interview, trim, chat)
    const cachedRes = await axios.get(`${API_BASE}/api/history/${historyItem.videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const cached = cachedRes.data.history;

    setStage('ready');

    // Restore chat messages if any exist, else show default greeting
    if (cached.chatMessages && cached.chatMessages.length > 0) {
      setMessages(cached.chatMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp)
      })));
    } else {
      setMessages([{
        role: 'assistant',
        content: `✅ Switched to ${historyItem.title}. Ask me anything about this video!`,
        timestamp: new Date()
      }]);
    }

    // Restore cached AI results
    if (cached.summary) setSummary(cached.summary);
    if (cached.mcqs) setMcqs(cached.mcqs);
    if (cached.interviewQuestions) setInterviewQs(cached.interviewQuestions);
    if (cached.trimResult) setTrimResult(cached.trimResult);

  } catch (err) {
    setError('Failed to switch video. Please try again.');
    setStage('idle');
  } finally {
    setIsProcessing(false);
  }
};

  const handleAsk = async () => {
    if (!question.trim() || !videoId || isAsking) return;

    const userMessage = {
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsAsking(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        videoId,
        question: userMessage.content
      },{
        headers: { Authorization: `Bearer ${token}`}
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        timestamp: new Date(),
        sources: res.data.sourceChunks
      }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ ' + (err.response?.data?.error || 'Failed to get answer. Please try again.'),
        timestamp: new Date()
      }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleSummarize = async () => {
    if (!videoId || !transcript || isSummarizing) return;
    setIsSummarizing(true);
    setSummary('');
    try {
      const res = await axios.post(`${API_BASE}/api/summarize`, {
        videoId,
        transcript
      });
      setSummary(res.data.summary);
    } catch (err) {
      setSummary('❌ Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTrim = async () => {
    if (!videoId || !rawTranscript.length || isTrimming) return;
    setIsTrimming(true);
    setTrimResult(null);
    try {
      const res = await axios.post(`${API_BASE}/api/trim`, {
        videoId,
        rawTranscript
      });
      setTrimResult(res.data);
    } catch (err) {
      alert('Failed to trim video. Please try again.');
    } finally {
      setIsTrimming(false);
    }
  };

  const handleGenerateNotes = async () => {
    if (!videoId || !transcript || isGeneratingNotes) return;
    setIsGeneratingNotes(true);
    setNotesReady(false);
    setNotesBlobUrl('');

    try {
      const res = await axios.post(
        `${API_BASE}/api/notes`,
        { videoId, transcript },
        { responseType: 'blob' }
      );
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      setNotesBlobUrl(blobUrl);
      setNotesReady(true);
    } catch (err) {
      alert('Failed to generate notes. Please try again.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleDownloadNotes = () => {
    const link = document.createElement('a');
    link.href = notesBlobUrl;
    link.download = `study-notes-${videoId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateMcqs = async () => {
    if (!videoId || !transcript || isGeneratingMcqs) return;
    setIsGeneratingMcqs(true);
    setMcqs(null);
    setUserAnswers({});
    setShowResults(false);

    try {
      const res = await axios.post(`${API_BASE}/api/mcq`, {
        videoId,
        transcript
      });
      setMcqs(res.data);
    } catch (err) {
      alert('Failed to generate MCQs. Please try again.');
    } finally {
      setIsGeneratingMcqs(false);
    }
  };

  const handleAnswerSelect = (questionIndex, option) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmitQuiz = () => {
    if (Object.keys(userAnswers).length < mcqs.mcqs.length) {
      alert('Please answer all questions before submitting!');
      return;
    }
    setShowResults(true);
  };

  const handleRetakeQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  const handleGenerateInterview = async () => {
    if (!videoId || !transcript || isGeneratingInterview) return;
    setIsGeneratingInterview(true);
    setInterviewQs(null);

    try {
      const res = await axios.post(`${API_BASE}/api/interview`, {
        videoId,
        transcript
      });
      setInterviewQs(res.data);
    } catch (err) {
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setIsGeneratingInterview(false);
    }
  };

  const handleClear = async () => {
    if (videoId) {
      await axios.post(`${API_BASE}/api/clear-history`, 
        { videoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    setUrl('');
    setVideoId(null);
    setVideoTitle('');
    setMessages([]);
    setQuestion('');
    setError('');
    setStage('idle');
    setTranscript('');
    setRawTranscript([]);
    resetAllTools();
  };

  return (
    <div className="app">

      <div className="bg-animation">
        <div className="bg-orb orb1"></div>
        <div className="bg-orb orb2"></div>
        <div className="bg-orb orb3"></div>
        <div className="bg-orb orb4"></div>
      </div>

      <div className="bg-grid"></div>

      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="corner-decoration top-left"></div>
      <div className="corner-decoration top-right"></div>
      <div className="corner-decoration bottom-left"></div>
      <div className="corner-decoration bottom-right"></div>

      <div className="side-decoration left">
        <div className="side-line"></div>
        <div className="side-dot"></div>
        <div className="side-icon">🧠</div>
        <div className="side-dot"></div>
        <div className="side-line"></div>
        <div className="side-dot"></div>
        <div className="side-icon">⚡</div>
        <div className="side-dot"></div>
        <div className="side-line"></div>
      </div>

      <div className="side-decoration right">
        <div className="side-line"></div>
        <div className="side-dot"></div>
        <div className="side-icon">🎬</div>
        <div className="side-dot"></div>
        <div className="side-line"></div>
        <div className="side-dot"></div>
        <div className="side-icon">💬</div>
        <div className="side-dot"></div>
        <div className="side-line"></div>
      </div>

      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎬</span>
            <div>
              <h1 className="logo-title">YouTube Learning Assistant</h1>
              <p className="logo-sub">Learn smarter. Skip the fluff. Keep the knowledge.</p>
            </div>
          </div>
          {videoId && (
            <button className="clear-btn" onClick={handleClear}
              style={{position: 'absolute', right: '100px'}}>
              🔄 New Chat
            </button>
          )}
          <button className="logout-btn" onClick={logout}
            style={{position: 'absolute', right: '24px'}}>
            Logout
          </button>
        </div>
      </header>

      {/* Video History Bar */}
      {videoHistory.length > 0 && (
        <div className="video-history-bar">
          <span className="history-label">📼 Recent:</span>
          <div className="history-chips">
            {videoHistory.map((v, idx) => (
              <button
                key={idx}
                className={`history-chip ${v.videoId === videoId ? 'active' : ''}`}
                onClick={() => handleSwitchVideo(v)}
                disabled={isProcessing}
              >
                {v.title.replace('Video: ', '')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">RAG</span>
          <span className="stat-label">Architecture</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">Gemini</span>
          <span className="stat-label">Powered</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">Vector</span>
          <span className="stat-label">Search</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">Real-time</span>
          <span className="stat-label">Answers</span>
        </div>
      </div>

      <main className="main">

        {/* URL INPUT CARD */}
        <div className={`url-section ${stage !== 'idle' ? 'compact' : ''}`}>
          <div className="url-card">
            {stage === 'idle' && (
              <div className="url-hero">
                <h2 className="url-hero-title">
                  Chat with any
                  <span className="gradient-text"> YouTube Video</span>
                </h2>
                <p className="url-hero-sub">
                  Paste a YouTube URL and start asking questions about the video content
                </p>
              </div>
            )}

            <div className="url-input-row">
              <div className="url-input-wrapper">
                <span className="url-icon">🔗</span>
                <input
                  type="text"
                  className="url-input"
                  placeholder="Paste YouTube URL here..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  disabled={isProcessing}
                />
              </div>
              <button
                className={`analyze-btn ${isProcessing ? 'loading' : ''}`}
                onClick={handleAnalyze}
                disabled={isProcessing || !url.trim()}
              >
                {isProcessing ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    {stage === 'extracting' ? 'Extracting...' : 'Processing...'}
                  </span>
                ) : '⚡ Analyze'}
              </button>
            </div>

            {isProcessing && (
              <div className="progress-bar">
                <div className={`progress-fill ${stage}`}></div>
              </div>
            )}

            {isProcessing && (
              <div className="processing-animation">
                <div className="processing-orb">
                  <div className="processing-ring ring1"></div>
                  <div className="processing-ring ring2"></div>
                  <div className="processing-ring ring3"></div>
                  <span className="processing-emoji">🧠</span>
                </div>
                <div className="processing-steps">
                  <div className={`step ${stage === 'extracting' ? 'active' : stage === 'processing' ? 'done' : ''}`}>
                    <span className="step-dot"></span>
                    <span className="step-text">Extracting transcript</span>
                  </div>
                  <div className={`step ${stage === 'processing' ? 'active' : ''}`}>
                    <span className="step-dot"></span>
                    <span className="step-text">Generating embeddings</span>
                  </div>
                  <div className="step">
                    <span className="step-dot"></span>
                    <span className="step-text">Building vector store</span>
                  </div>
                </div>
                <p className="processing-hint">This may take 1-2 minutes depending on video length</p>
              </div>
            )}

            {error && <p className="error-msg">⚠️ {error}</p>}

            {stage === 'ready' && (
              <div className="ready-section">
                <div className="video-badge">
                  <span className="badge-dot"></span>
                  Video ready — {videoTitle}
                </div>
                <p className="video-length-hint">
                  💡 Best results with Notes & MCQs on videos under 30 minutes
                </p>
                <div className="action-buttons">
                  <button
                    className={`summarize-btn ${isSummarizing ? 'loading' : ''}`}
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? (
                      <span className="btn-loading"><span className="spinner"></span>Summarizing...</span>
                    ) : '📝 Summarize'}
                  </button>

                  <button
                    className={`notes-btn ${isGeneratingNotes ? 'loading' : ''}`}
                    onClick={handleGenerateNotes}
                    disabled={isGeneratingNotes}
                  >
                    {isGeneratingNotes ? (
                      <span className="btn-loading"><span className="spinner"></span>Generating...</span>
                    ) : '📚 Generate Notes'}
                  </button>

                  <button
                    className={`mcq-btn ${isGeneratingMcqs ? 'loading' : ''}`}
                    onClick={handleGenerateMcqs}
                    disabled={isGeneratingMcqs}
                  >
                    {isGeneratingMcqs ? (
                      <span className="btn-loading"><span className="spinner"></span>Generating...</span>
                    ) : '❓ Generate MCQs'}
                  </button>

                  <button
                    className={`interview-btn ${isGeneratingInterview ? 'loading' : ''}`}
                    onClick={handleGenerateInterview}
                    disabled={isGeneratingInterview}
                  >
                    {isGeneratingInterview ? (
                      <span className="btn-loading"><span className="spinner"></span>Generating...</span>
                    ) : '💼 Interview Prep'}
                  </button>

                  <button
                    className={`trim-btn ${isTrimming ? 'loading' : ''}`}
                    onClick={handleTrim}
                    disabled={isTrimming}
                  >
                    {isTrimming ? (
                      <span className="btn-loading"><span className="spinner"></span>Trimming...</span>
                    ) : '✂️ Smart Trim'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════ RESULT CARDS ═══════ */}

        {summary && (
          <div className="result-block">
            <div className="summary-card">
              <div className="summary-header">
                <h3 className="summary-title">📺 Video Summary</h3>
                <button className="summary-close" onClick={() => setSummary('')}>✕</button>
              </div>
              <div className="summary-content">{summary}</div>
            </div>
          </div>
        )}

        {notesReady && (
          <div className="result-block">
            <div className="notes-ready-card">
              <div className="notes-ready-icon">📚</div>
              <div className="notes-ready-text">
                <h4>Study Notes Ready!</h4>
                <p>Your comprehensive PDF notes have been generated</p>
              </div>
              <button className="download-notes-btn" onClick={handleDownloadNotes}>
                ⬇️ Download PDF
              </button>
            </div>
          </div>
        )}

        {mcqs && (
          <div className="result-block">
            <div className="mcq-card">
              <div className="mcq-header">
                <div>
                  <h3 className="mcq-title">❓ MCQ Quiz</h3>
                  <p className="mcq-topic">{mcqs.topic}</p>
                </div>
                <button className="summary-close" onClick={() => {
                  setMcqs(null);
                  setUserAnswers({});
                  setShowResults(false);
                }}>✕</button>
              </div>

              {showResults && (
                <div className="score-banner">
                  <span className="score-value">
                    {mcqs.mcqs.filter((q, i) => userAnswers[i] === q.correct).length}
                    /{mcqs.mcqs.length}
                  </span>
                  <span className="score-label">
                    {Math.round(mcqs.mcqs.filter((q, i) =>
                      userAnswers[i] === q.correct).length / mcqs.mcqs.length * 100)}% Score
                  </span>
                  <button className="retake-btn" onClick={handleRetakeQuiz}>
                    🔄 Retake Quiz
                  </button>
                </div>
              )}

              <div className="mcq-questions">
                {mcqs.mcqs.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isCorrect = userAnswer === q.correct;

                  return (
                    <div key={idx} className={`mcq-question ${showResults ? (isCorrect ? 'correct' : 'wrong') : ''}`}>
                      <p className="question-text">
                        <span className="question-num">Q{idx + 1}.</span> {q.question}
                      </p>

                      <div className="options">
                        {Object.entries(q.options).map(([key, value]) => {
                          let optionClass = 'option';
                          if (showResults) {
                            if (key === q.correct) optionClass += ' option-correct';
                            else if (key === userAnswer) optionClass += ' option-wrong';
                          } else if (userAnswer === key) {
                            optionClass += ' option-selected';
                          }

                          return (
                            <button
                              key={key}
                              className={optionClass}
                              onClick={() => handleAnswerSelect(idx, key)}
                            >
                              <span className="option-key">{key}</span>
                              <span className="option-value">{value}</span>
                            </button>
                          );
                        })}
                      </div>

                      {showResults && (
                        <div className={`explanation ${isCorrect ? 'exp-correct' : 'exp-wrong'}`}>
                          <span>{isCorrect ? '✅' : '❌'}</span>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!showResults && (
                <button className="submit-quiz-btn" onClick={handleSubmitQuiz}>
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {interviewQs && (
          <div className="result-block">
            <div className="interview-card">
              <div className="interview-header">
                <div>
                  <h3 className="interview-title">💼 Interview Questions</h3>
                  <p className="interview-topic">{interviewQs.topic}</p>
                </div>
                <button className="summary-close" onClick={() => setInterviewQs(null)}>✕</button>
              </div>

              {interviewQs.basic && interviewQs.basic.length > 0 && (
                <div className="interview-level">
                  <h4 className="level-label basic-label">📗 BASIC LEVEL</h4>
                  {interviewQs.basic.map((item, idx) => (
                    <div key={idx} className="interview-question">
                      <p className="iq-question">Q{idx + 1}. {item.question}</p>
                      <p className="iq-tip">💡 Tip: {item.tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {interviewQs.intermediate && interviewQs.intermediate.length > 0 && (
                <div className="interview-level">
                  <h4 className="level-label intermediate-label">📘 INTERMEDIATE LEVEL</h4>
                  {interviewQs.intermediate.map((item, idx) => (
                    <div key={idx} className="interview-question">
                      <p className="iq-question">Q{idx + 1}. {item.question}</p>
                      <p className="iq-tip">💡 Tip: {item.tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {interviewQs.advanced && interviewQs.advanced.length > 0 && (
                <div className="interview-level">
                  <h4 className="level-label advanced-label">📕 ADVANCED LEVEL</h4>
                  {interviewQs.advanced.map((item, idx) => (
                    <div key={idx} className="interview-question">
                      <p className="iq-question">Q{idx + 1}. {item.question}</p>
                      <p className="iq-tip">💡 Tip: {item.tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {trimResult && (
          <div className="result-block">
            <div className="trim-card">
              <div className="trim-header">
                <h3 className="trim-title">✂️ Smart Video Trimmer</h3>
                <button className="summary-close" onClick={() => setTrimResult(null)}>✕</button>
              </div>

              <div className="trim-stats">
                <div className="trim-stat">
                  <span className="trim-stat-value">{trimResult.totalDuration}</span>
                  <span className="trim-stat-label">Original</span>
                </div>
                <div className="trim-stat highlight">
                  <span className="trim-stat-value">{trimResult.contentDuration}</span>
                  <span className="trim-stat-label">Content Only</span>
                </div>
                <div className="trim-stat saved">
                  <span className="trim-stat-value">{trimResult.timeSaved}</span>
                  <span className="trim-stat-label">Time Saved</span>
                </div>
                <div className="trim-stat percent">
                  <span className="trim-stat-value">{trimResult.timeSavedPercent}%</span>
                  <span className="trim-stat-label">Shorter</span>
                </div>
              </div>

              <p className="trim-subtitle">📌 Watch these segments only:</p>

              <div className="trim-segments">
                {trimResult.watchSegments.map((seg, idx) => (
                  <a
                    key={idx}
                    href={seg.youtubeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="trim-segment"
                  >
                    <div className="segment-number">{seg.index}</div>
                    <div className="segment-info">
                      <span className="segment-time">▶ {seg.startTime} — {seg.endTime}</span>
                      <span className="segment-duration">{seg.duration}</span>
                    </div>
                    <div className="segment-arrow">→</div>
                  </a>
                ))}
              </div>

              <p className="trim-tagline">⚡ Skip the fluff. Keep the knowledge.</p>
            </div>
          </div>
        )}

        {/* Chat Section */}
        {messages.length > 0 && (
          <div className="chat-section">
            <div className="chat-card">
              <div className="messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-body">
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isAsking && (
                  <div className="message assistant">
                    <div className="message-avatar">🤖</div>
                    <div className="message-body">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-section">
                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    placeholder="Ask anything about the video..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isAsking || stage !== 'ready'}
                    rows={1}
                  />
                  <button
                    className={`send-btn ${isAsking ? 'loading' : ''}`}
                    onClick={handleAsk}
                    disabled={isAsking || !question.trim() || stage !== 'ready'}
                  >
                    {isAsking ? <span className="spinner"></span> : '➤'}
                  </button>
                </div>
                <p className="chat-hint">Press Enter to send · Shift+Enter for new line</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature cards — only show on idle */}
        {stage === 'idle' && (
          <div className="features-grid">
            {[
              { icon: '🧠', title: 'RAG Powered', desc: 'Retrieval-Augmented Generation for accurate, grounded answers' },
              { icon: '⚡', title: 'Fast Search', desc: 'Cosine similarity search across the full video transcript' },
              { icon: '💬', title: 'Chat Memory', desc: 'Remembers context for natural follow-up conversations' },
              { icon: '🎯', title: 'Source Grounded', desc: 'Every answer is strictly based on video content only' },
              { icon: '📝', title: 'Smart Summary', desc: 'Generate structured summaries from any video instantly' },
              { icon: '📚', title: 'Study Notes', desc: 'Auto-generate detailed PDF notes for exam revision' },
              { icon: '❓', title: 'MCQ Quiz', desc: 'Test yourself with auto-generated multiple choice questions' },
              { icon: '💼', title: 'Interview Prep', desc: 'Get likely interview questions based on video content' },
              { icon: '✂️', title: 'Video Trimmer', desc: 'Skip the fluff — watch only the valuable parts' },
              { icon: '📼', title: 'Multi-Video', desc: 'Switch between multiple videos without losing progress' }
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;