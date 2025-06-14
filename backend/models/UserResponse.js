// models/UserResponse.js

const mongoose = require('mongoose');


const userResponseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  responses: [{
    questionId: {
      type: Number,
      required: true
    },
    answerId: Number,
    answerTextAng: String,
    score: {
      type: Number,
      required: true
    },
    questionTextAng: String,
    categoryAngShort: String
  }],
  categoryScores: [{
    categoryAng: String,
    categoryAngShort: String,
    score: Number,        
    rawScore: Number,     
    maxPossible: Number  
  }],
  score: Number,
  rawScore: Number,
  maxPossible: Number,
  profile: String,
  Pr: Number,
  Co: Number,
  Op: Number,
  Ad: Number,
  Ci: Number,
  KBICONSO: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'user_responses' });

const UserResponse = mongoose.model("user_response", userResponseSchema);
module.exports = UserResponse;
