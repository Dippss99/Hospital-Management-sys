import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  patient: [
    { to: '/patient', label: 'Dashboard', icon: '🏠' },
    { to: '/patient/appointments', label: 'Appointments', icon: '📅' },
    { to: '/patient/reports', label: 'My Reports', icon: '📄' },
    { to: '/patient/book', label: 'Book Appointment', icon: '➕' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: '🏠' },
    { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
    { to: '/doctor/patients', label: 'Patients', icon: '👥' },
    { to: '/doctor/upload', label: 'Upload Report', icon: '📤' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { to: '/admin/patients', label: 'Patients', icon: '👥' },
    { to: '/admin/appointments', label: 'Appointments', icon: '📅' },
    { to: '/admin/billing', label: 'Billing', icon: '💰' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span>🏥</span> MediCare
      </div>
      <nav className="sidebar-nav">
        <div style={{ padding: '12px 20px 8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {user?.role}
        </div>
        {(navItems[user?.role] || []).map(item => (
          <NavLink key={item.to} to={item.to} end={item.to.split('/').length === 2}
            className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="icon">{item.icon}</span> {item.label}
          </NavLink>
        ))}
        <button onClick={handleLogout} style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <span className="icon">🚪</span> Logout
        </button>
      </nav>
    </aside>
  );
}
