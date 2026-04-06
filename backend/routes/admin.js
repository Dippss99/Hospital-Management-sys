const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get dashboard stats
router.get('/stats', auth(['admin']), async (req, res) => {
  try {
    const [p] = await db.query('SELECT COUNT(*) as patients FROM patients');
    const [d] = await db.query('SELECT COUNT(*) as doctors FROM doctors');
    const [a] = await db.query('SELECT COUNT(*) as appointments FROM appointments');
    const [b] = await db.query('SELECT COALESCE(SUM(amount), 0) as billing FROM billing');
    res.json({
      patients: p[0].patients,
      doctors: d[0].doctors,
      appointments: a[0].appointments,
      billing: b[0].billing
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Billing - create bill
router.post('/billing', auth(['admin']), async (req, res) => {
  const { patient_id, description, amount } = req.body;
  try {
    await db.query(
      'INSERT INTO billing (patient_id, description, amount) VALUES (?, ?, ?)',
      [patient_id, description, amount]
    );
    res.status(201).json({ message: 'Bill created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all bills
router.get('/billing', auth(['admin']), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, p.name as patient_name FROM billing b 
       JOIN patients p ON b.patient_id = p.id ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update bill status
router.put('/billing/:id', auth(['admin']), async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE billing SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Bill updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete doctor
router.delete('/doctors/:id', auth(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Doctor removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete patient
router.delete('/patients/:id', auth(['admin']), async (req, res) => {
  try {
    await db.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Patient removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
