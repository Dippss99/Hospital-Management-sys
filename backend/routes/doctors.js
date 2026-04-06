const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get all doctors (public - for booking)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, specialization, phone, email FROM doctors');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get doctor profile
router.get('/profile', auth(['doctor']), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update patient notes (doctor)
router.put('/patient-notes/:patientId', auth(['doctor']), async (req, res) => {
  const { notes } = req.body;
  try {
    await db.query('UPDATE patients SET notes = ? WHERE id = ?', [notes, req.params.patientId]);
    res.json({ message: 'Notes updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
