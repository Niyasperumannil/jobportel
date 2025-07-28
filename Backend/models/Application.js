// models/Application.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApplicationSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: String,
  resume: String,
  status: {
    type: String,
    enum: ['pending', 'interview', 'rejected', 'hired', 'accepted'], // added 'accepted'
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Application', ApplicationSchema);
