import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import API from '../api';
import Sidebar from '../components/Sidebar';

function AdminHome() {
  const [stats, setStats] = useState({ patients: 0, doctors: 0, appointments: 0, billing: 0 });

  useEffect(() => { API.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}); }, []);

  return (
    <>
      <div className="page-header"><h2>Admin Dashboard 🛡️</h2></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{stats.patients}</div><div className="stat-label">Total Patients</div></div>
        <div className="stat-card green"><div className="stat-number">{stats.doctors}</div><div className="stat-label">Total Doctors</div></div>
        <div className="stat-card orange"><div className="stat-number">{stats.appointments}</div><div className="stat-label">Appointments</div></div>
        <div className="stat-card red"><div className="stat-number">₹{Number(stats.billing).toLocaleString()}</div><div className="stat-label">Total Billing</div></div>
      </div>
      <div className="card">
        <div className="card-title">AWS Infrastructure</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { icon: '🖥️', name: 'Amazon EC2', desc: 'Backend Server Hosting' },
            { icon: '🗄️', name: 'Amazon RDS', desc: 'MySQL Database' },
            { icon: '📦', name: 'Amazon S3', desc: 'Patient Reports Storage' },
            { icon: '🔐', name: 'AWS IAM', desc: 'Access Control' },
          ].map(s => (
            <div key={s.name} style={{ background: '#f0f4f8', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 600, marginTop: '8px' }}>{s.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const load = () => API.get('/doctors').then(r => setDoctors(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (window.confirm('Remove this doctor?')) {
      await API.delete(`/admin/doctors/${id}`);
      load();
    }
  };

  return (
    <>
      <div className="page-header"><h2>Manage Doctors</h2></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Specialization</th><th>Action</th></tr></thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id}>
                  <td>👨⚕️ {d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.phone}</td>
                  <td>{d.specialization}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(d.id)}>Remove</button></td>
                </tr>
              ))}
              {!doctors.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#718096' }}>No doctors registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const load = () => API.get('/patients/all').then(r => setPatients(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (window.confirm('Remove this patient?')) {
      await API.delete(`/admin/patients/${id}`);
      load();
    }
  };

  return (
    <>
      <div className="page-header"><h2>Manage Patients</h2></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Blood Group</th><th>Registered</th><th>Action</th></tr></thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td>👤 {p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>{p.blood_group || '-'}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>Remove</button></td>
                </tr>
              ))}
              {!patients.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>No patients registered</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  useEffect(() => { API.get('/appointments/all').then(r => setAppointments(r.data)).catch(() => {}); }, []);

  return (
    <>
      <div className="page-header"><h2>All Appointments</h2></div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td>{a.patient_name}</td>
                  <td>{a.doctor_name}</td>
                  <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                  <td>{a.appointment_time}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
              {!appointments.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#718096' }}>No appointments</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AdminBilling() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patient_id: '', description: '', amount: '' });
  const [msg, setMsg] = useState('');

  const load = () => API.get('/admin/billing').then(r => setBills(r.data)).catch(() => {});
  useEffect(() => {
    load();
    API.get('/patients/all').then(r => setPatients(r.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    await API.post('/admin/billing', form);
    setMsg('Bill created!'); setForm({ patient_id: '', description: '', amount: '' });
    load(); setTimeout(() => setMsg(''), 2000);
  };

  const updateStatus = async (id, status) => {
    await API.put(`/admin/billing/${id}`, { status });
    load();
  };

  return (
    <>
      <div className="page-header"><h2>Billing Management</h2></div>
      <div className="card" style={{ maxWidth: 500, marginBottom: '20px' }}>
        <div className="card-title">Create New Bill</div>
        {msg && <div className="success-msg">{msg}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Patient</label>
            <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">-- Select Patient --</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Consultation fee" required />
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" required />
          </div>
          <button className="btn btn-primary" type="submit">Create Bill</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">All Bills</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Patient</th><th>Description</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id}>
                  <td>{b.patient_name}</td>
                  <td>{b.description}</td>
                  <td>₹{b.amount}</td>
                  <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    {b.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.id, 'paid')}>Mark Paid</button>}
                    {b.status !== 'cancelled' && <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.id, 'cancelled')}>Cancel</button>}
                  </td>
                </tr>
              ))}
              {!bills.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#718096' }}>No bills yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="billing" element={<AdminBilling />} />
        </Routes>
      </main>
    </div>
  );
}
