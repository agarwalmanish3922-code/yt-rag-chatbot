const mongoose = require('mongoose');

const videoHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  title: String,
  url: String,
  transcript: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VideoHistory', videoHistorySchema);