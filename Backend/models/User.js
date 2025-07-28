const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role:     { type: String, enum: ['job_seeker', 'employer'], required: true },
  company:  { type: String, required: function() { return this.role === 'employer'; } }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
