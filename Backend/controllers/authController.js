const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /register
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, company } = req.body;

    if (!['job_seeker', 'employer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be job_seeker or employer' });
    }
    if (role === 'employer' && !company) {
      return res.status(400).json({ message: 'Company is required for employer' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, role, company });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /me
exports.me = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json(user);
};
