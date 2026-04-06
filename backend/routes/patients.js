const router = require('express').Router();
const multer = require('multer');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { uploadToS3, getSignedFileUrl } = require('../config/s3');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Get patient profile
router.get('/profile', auth(['patient']), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients WHERE user_id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload report to S3
router.post('/reports/upload', auth(['patient', 'doctor']), upload.single('report'), async (req, res) => {
  try {
    const { patient_id, report_name } = req.body;
    const key = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);
    await db.query(
      'INSERT INTO reports (patient_id, report_name, s3_key, uploaded_by) VALUES (?, ?, ?, ?)',
      [patient_id, report_name || req.file.originalname, key, req.user.id]
    );
    res.status(201).json({ message: 'Report uploaded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get patient reports with signed S3 URLs
router.get('/reports', auth(['patient', 'doctor', 'admin']), async (req, res) => {
  try {
    const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    const pid = req.query.patient_id || patient[0]?.id;
    const [reports] = await db.query('SELECT * FROM reports WHERE patient_id = ? ORDER BY created_at DESC', [pid]);

    const reportsWithUrls = await Promise.all(
      reports.map(async (r) => ({ ...r, url: await getSignedFileUrl(r.s3_key) }))
    );
    res.json(reportsWithUrls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all patients (admin/doctor)
router.get('/all', auth(['admin', 'doctor']), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM patients ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
