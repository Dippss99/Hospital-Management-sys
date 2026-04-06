# 🏥 MediCare - Cloud-Based Hospital Management System

A full-stack Hospital Management System built with **React**, **Node.js/Express**, and **AWS Cloud Services**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | Amazon RDS (MySQL) |
| File Storage | Amazon S3 |
| Hosting | Amazon EC2 |
| Auth | JWT + bcrypt |
| Access Control | AWS IAM |

## Features

- **Authentication** - Login/Register for Admin, Doctor, Patient with JWT
- **Patient Dashboard** - View appointments, reports, book appointments
- **Doctor Dashboard** - Manage appointments, update patient notes, upload reports
- **Admin Panel** - Manage doctors/patients, billing, view all appointments
- **File Upload** - Patient reports stored securely in Amazon S3
- **Responsive UI** - Works on desktop and mobile

## Project Structure

```
Cc Assignment/
├── backend/
│   ├── config/
│   │   ├── db.js          # RDS MySQL connection
│   │   └── s3.js          # S3 upload/download
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── routes/
│   │   ├── auth.js        # Login/Register
│   │   ├── appointments.js
│   │   ├── patients.js    # + S3 report upload
│   │   ├── doctors.js
│   │   └── admin.js       # Billing + management
│   ├── schema.sql         # MySQL database schema
│   ├── server.js          # Express entry point
│   └── .env               # AWS credentials (DO NOT COMMIT)
├── frontend/
│   └── src/
│       ├── context/AuthContext.js
│       ├── components/Sidebar.js
│       ├── pages/
│       │   ├── AuthPage.js
│       │   ├── PatientDashboard.js
│       │   ├── DoctorDashboard.js
│       │   └── AdminDashboard.js
│       ├── api.js          # Axios instance
│       └── App.js          # Routes
└── DEPLOYMENT.md           # AWS deployment steps
```

## Quick Start (Local)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm start
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full AWS deployment guide.
