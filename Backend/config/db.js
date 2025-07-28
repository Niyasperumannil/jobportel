require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  console.log('DB env var value:', process.env.MONGO_URI);
  if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI not defined in environment');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('MongoDB connected to', mongoose.connection.host);
};

module.exports = connectDB;
