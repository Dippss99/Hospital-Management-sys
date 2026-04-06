const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!['admin', 'doctor', 'patient'].includes(role))
    return res.status(400).json({ message: 'Invalid role' });

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, role, phone]
    );

    // Create role-specific record
    if (role === 'patient') {
      await db.query('INSERT INTO patients (user_id, name, email, phone) VALUES (?, ?, ?, ?)',
        [result.insertId, name, email, phone]);
    } else if (role === 'doctor') {
      const { specialization } = req.body;
      await db.query('INSERT INTO doctors (user_id, name, email, phone, specialization) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, name, email, phone, specialization || 'General']);
    }

    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
