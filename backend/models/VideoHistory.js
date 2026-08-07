const mongoose = require('mongoose');

const videoHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: { type: String, required: true },
  title: String,
  url: String,
  transcript: String,
  rawTranscript: Array,

  // Cached AI results
  summary: { type: String, default: '' },
  mcqs: { type: mongoose.Schema.Types.Mixed, default: null },
  interviewQuestions: { type: mongoose.Schema.Types.Mixed, default: null },
  trimResult: { type: mongoose.Schema.Types.Mixed, default: null },
  chatMessages: { type: Array, default: [] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VideoHistory', videoHistorySchema);