import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function PatientHome() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    API.get('/appointments/my').then(r => setAppointments(r.data)).catch(() => {});
    API.get('/patients/reports').then(r => setReports(r.data)).catch(() => {});
  }, []);

  const upcoming = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');

  return (
    <>
      <div className="page-header"><h2>Welcome, {user?.name} 👋</h2></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{appointments.length}</div><div className="stat-label">Total Appointments</div></div>
        <div className="stat-card green"><div className="stat-number">{upcoming.length}</div><div className="stat-label">Upcoming</div></div>
        <div className="stat-card orange"><div className="stat-number">{reports.length}</div><div className="stat-label">Reports</div></div>
      </div>
      <div className="card">
        <div className="card-title">Recent Appointments</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.slice(0, 5).map(a => (
                <tr key={a.id}>
                  <td>{a.doctor_name}</td>
                  <td>{a.specialization}</td>
                  <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                  <td>{a.appointment_time}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
              {!appointments.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#718096' }}>No appointments yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { API.get('/doctors').then(r => setDoctors(r.data)); }, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setMsg(''); setError('');
    try {
      await API.post('/appointments', form);
      setMsg('Appointment booked successfully!');
      setForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '' });
    } catch (err) { setError(err.response?.data?.message || 'Booking failed'); }
  };

  return (
    <>
      <div className="page-header"><h2>Book Appointment</h2></div>
      <div className="card" style={{ maxWidth: 500 }}>
        {msg && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Select Doctor</label>
            <select name="doctor_id" value={form.doctor_id} onChange={handle} required>
              <option value="">-- Choose Doctor --</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="appointment_date" value={form.appointment_date} onChange={handle} required min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" name="appointment_time" value={form.appointment_time} onChange={handle} required />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea name="reason" value={form.reason} onChange={handle} rows="3" placeholder="Describe your symptoms..." />
          </div>
          <button className="btn btn-primary" type="submit">Book Appointment</button>
        </form>
      </div>
    </>
  );
}

function PatientReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => { API.get('/patients/reports').then(r => setReports(r.data)).catch(() => {}); }, []);

  return (
    <>
      <div className="page-header"><h2>My Reports</h2></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Report Name</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>📄 {r.report_name}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td><a href={r.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">View</a></td>
                </tr>
              ))}
              {!reports.length && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#718096' }}>No reports uploaded yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => { API.get('/appointments/my').then(r => setAppointments(r.data)).catch(() => {}); }, []);

  return (
    <>
      <div className="page-header"><h2>My Appointments</h2></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Doctor</th><th>Specialization</th><th>Date</th><th>Time</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>{a.doctor_name}</td>
                  <td>{a.specialization}</td>
                  <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                  <td>{a.appointment_time}</td>
                  <td>{a.reason || '-'}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
              {!appointments.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>No appointments</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function PatientDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route index element={<PatientHome />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="reports" element={<PatientReports />} />
          <Route path="book" element={<BookAppointment />} />
        </Routes>
      </main>
    </div>
  );
}
