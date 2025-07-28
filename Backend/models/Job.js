const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  company: { type: String, required: true },
  location: String,
  salary: String,
  requirements: [String],
  employer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', JobSchema);
