const conversationHistory = {};

function getHistory(userId, videoId) {
  const key = `${userId}_${videoId}`;
  return conversationHistory[key] || [];
}

function addToHistory(userId, videoId, role, content) {
  const key = `${userId}_${videoId}`;
  if (!conversationHistory[key]) {
    conversationHistory[key] = [];
  }
  conversationHistory[key].push({ role, content });
}

function clearHistory(userId, videoId) {
  const key = `${userId}_${videoId}`;
  conversationHistory[key] = [];
}

module.exports = { getHistory, addToHistory, clearHistory };