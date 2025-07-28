require('dotenv').config(); // Load .env first
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const appRoutes = require('./routes/applicationRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicationRoutes', appRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

connectDB().then(() => {
  const PORT = process.env.PORT || 7000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});