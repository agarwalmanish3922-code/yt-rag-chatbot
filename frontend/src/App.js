import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:5000';

function App() {
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
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setError('');
    setIsProcessing(true);
    setStage('extracting');
    setMessages([]);
    setSummary('');

    try {
      const extractRes = await axios.post(`${API_BASE}/api/extract`, { url });
      const { videoId: vid, transcript } = extractRes.data;
      setVideoId(vid);
      setVideoTitle(`Video: ${vid}`);
      setTranscript(transcript);
      setStage('processing');

      await axios.post(`${API_BASE}/api/process`, {
        videoId: vid,
        transcript
      });

      setStage('ready');
      setMessages([{
        role: 'assistant',
        content: '✅ Video analyzed successfully! I\'ve read through the entire transcript. Ask me anything about this video.',
        timestamp: new Date()
      }]);

    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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

  const handleClear = async () => {
    if (videoId) {
      await axios.post(`${API_BASE}/api/clear-history`, { videoId });
    }
    setUrl('');
    setVideoId(null);
    setVideoTitle('');
    setMessages([]);
    setQuestion('');
    setError('');
    setStage('idle');
    setTranscript('');
    setSummary('');
  };

  return (
    <div className="app">

      {/* Animated background orbs */}
      <div className="bg-animation">
        <div className="bg-orb orb1"></div>
        <div className="bg-orb orb2"></div>
        <div className="bg-orb orb3"></div>
        <div className="bg-orb orb4"></div>
      </div>

      {/* Grid overlay */}
      <div className="bg-grid"></div>

      {/* Floating particles */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      {/* Corner decorations */}
      <div className="corner-decoration top-left"></div>
      <div className="corner-decoration top-right"></div>
      <div className="corner-decoration bottom-left"></div>
      <div className="corner-decoration bottom-right"></div>

      {/* Left side decoration */}
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

      {/* Right side decoration */}
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

      {/* Header */}
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
              style={{position: 'absolute', right: '24px'}}>
              🔄 New Chat
            </button>
          )}
        </div>
      </header>

      {/* Stats bar */}
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

        {/* URL Input Section */}
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
                <button
                  className={`summarize-btn ${isSummarizing ? 'loading' : ''}`}
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                >
                  {isSummarizing ? (
                    <span className="btn-loading">
                      <span className="spinner"></span>
                      Summarizing...
                    </span>
                  ) : '📝 Summarize Video'}
                </button>
              </div>
            )}

            {/* Summary Display */}
            {summary && (
              <div className="summary-card">
                <div className="summary-header">
                  <h3 className="summary-title">📺 Video Summary</h3>
                  <button
                    className="summary-close"
                    onClick={() => setSummary('')}
                  >✕</button>
                </div>
                <div className="summary-content">
                  {summary}
                </div>
              </div>
            )}

          </div>
        </div>

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
                        <span></span>
                        <span></span>
                        <span></span>
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
              { icon: '📝', title: 'Smart Notes', desc: 'Generate structured study notes from any video' },
              { icon: '✂️', title: 'Video Trimmer', desc: 'Skip the fluff — watch only the valuable parts' }
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