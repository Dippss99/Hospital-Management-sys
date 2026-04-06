import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function DoctorHome() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);

  useEffect(() => { API.get('/appointments/doctor').then(r => setAppointments(r.data)).catch(() => {}); }, []);

  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  };

  return (
    <>
      <div className="page-header"><h2>Doctor Dashboard 👨‍⚕️</h2><span style={{ color: '#718096' }}>Dr. {user?.name}</span></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{counts.total}</div><div className="stat-label">Total Appointments</div></div>
        <div className="stat-card orange"><div className="stat-number">{counts.pending}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card green"><div className="stat-number">{counts.confirmed}</div><div className="stat-label">Confirmed</div></div>
        <div className="stat-card"><div className="stat-number">{counts.completed}</div><div className="stat-label">Completed</div></div>
      </div>
      <div className="card">
        <div className="card-title">Today's Appointments</div>
        <AppointmentTable appointments={appointments.slice(0, 5)} onUpdate={() => {}} />
      </div>
    </>
  );
}

function AppointmentTable({ appointments, onUpdate }) {
  const updateStatus = async (id, status) => {
    await API.put(`/appointments/${id}/status`, { status });
    onUpdate();
  };





  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Patient</th><th>Phone</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {appointments.map(a => (
            <tr key={a.id}>
              <td>{a.patient_name}</td>
              <td>{a.patient_phone}</td>
              <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
              <td>{a.appointment_time}</td>
              <td>{a.reason || '-'}</td>
              <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
              <td style={{ display: 'flex', gap: '4px' }}>
                {a.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>}
                {a.status === 'confirmed' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(a.id, 'completed')}>Complete</button>}
                {a.status !== 'cancelled' && a.status !== 'completed' && (
                  <button className="btn btn-danger btn-sm" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                )}
              </td>
            </tr>
          ))}
          {!appointments.length && <tr><td colSpan="7" style={{ textAlign: 'center', color: '#718096' }}>No appointments</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const load = () => API.get('/appointments/doctor').then(r => setAppointments(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="page-header"><h2>All Appointments</h2></div>
      <div className="card"><AppointmentTable appointments={appointments} onUpdate={load} /></div>
    </>
  );
}

function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [notes, setNotes] = useState({});
  const [saved, setSaved] = useState('');

  useEffect(() => { API.get('/patients/all').then(r => setPatients(r.data)).catch(() => {}); }, []);

  const saveNotes = async (id) => {
    await API.put(`/doctors/patient-notes/${id}`, { notes: notes[id] });
    setSaved('Notes saved!');
    setTimeout(() => setSaved(''), 2000);
  };

  return (
    <>
      <div className="page-header"><h2>Patients</h2></div>
      {saved && <div className="success-msg">{saved}</div>}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood Group</th><th>Notes</th><th>Action</th></tr></thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>{p.blood_group || '-'}</td>
                  <td>
                    <input style={{ padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', width: '150px' }}
                      defaultValue={p.notes || ''}
                      onChange={e => setNotes({ ...notes, [p.id]: e.target.value })}
                      placeholder="Add notes..." />
                  </td>
                  <td><button className="btn btn-success btn-sm" onClick={() => saveNotes(p.id)}>Save</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function UploadReport() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient_id: '', report_name: '' });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { API.get('/patients/all').then(r => setPatients(r.data)).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('report', file);
      fd.append('patient_id', form.patient_id);
      fd.append('report_name', form.report_name);
      await API.post('/patients/reports/upload', fd);
      setMsg('Report uploaded to S3 successfully!');
      setForm({ patient_id: '', report_name: '' }); setFile(null);
    } catch (err) { setError(err.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-header"><h2>Upload Patient Report</h2></div>
      <div className="card" style={{ maxWidth: 500 }}>
        <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '16px' }}>📦 Files are stored securely in Amazon S3</p>
        {msg && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Select Patient</label>
            <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">-- Select Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Report Name</label>
            <input value={form.report_name} onChange={e => setForm({ ...form, report_name: e.target.value })} placeholder="e.g. Blood Test Report" required />
          </div>
          <div className="form-group">
            <label>File (PDF/Image, max 10MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload to S3'}</button>
        </form>
      </div>
    </>
  );
}

export default function DoctorDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route index element={<DoctorHome />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="upload" element={<UploadReport />} />
        </Routes>
      </main>
    </div>
  );
}
