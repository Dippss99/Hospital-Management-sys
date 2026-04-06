const router = require('express').Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Book appointment (patient)
router.post('/', auth(['patient']), async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, reason } = req.body;
  try {
    const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });

    await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?, ?)',
      [patient[0].id, doctor_id, appointment_date, appointment_time, reason]
    );
    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get appointments for patient
router.get('/my', auth(['patient']), async (req, res) => {
  try {
    const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    const [rows] = await db.query(
      `SELECT a.*, d.name as doctor_name, d.specialization 
       FROM appointments a JOIN doctors d ON a.doctor_id = d.id 
       WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
      [patient[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get appointments for doctor
router.get('/doctor', auth(['doctor']), async (req, res) => {
  try {
    const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    const [rows] = await db.query(
      `SELECT a.*, p.name as patient_name, p.phone as patient_phone 
       FROM appointments a JOIN patients p ON a.patient_id = p.id 
       WHERE a.doctor_id = ? ORDER BY a.appointment_date DESC`,
      [doctor[0].id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update appointment status (doctor)
router.put('/:id/status', auth(['doctor', 'admin']), async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all appointments (admin)
router.get('/all', auth(['admin']), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name 
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       JOIN doctors d ON a.doctor_id = d.id 
       ORDER BY a.appointment_date DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
