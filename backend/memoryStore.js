// Stores conversation history per videoId per session
// Structure: { videoId: [ {role, content}, {role, content}, ... ] }
const conversationHistory = {};

// Get history for a video
function getHistory(videoId) {
  return conversationHistory[videoId] || [];
}

// Add a new message to history
function addToHistory(videoId, role, content) {
  if (!conversationHistory[videoId]) {
    conversationHistory[videoId] = [];
  }
  conversationHistory[videoId].push({ role, content });
}

// Clear history for a video (when user wants to start fresh)
function clearHistory(videoId) {
  conversationHistory[videoId] = [];
}

module.exports = { getHistory, addToHistory, clearHistory };