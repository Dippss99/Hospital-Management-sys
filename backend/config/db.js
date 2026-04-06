const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../hospital.db');

let db = null;

const persist = () => {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
};

setInterval(persist, 5000);

const initDB = async () => {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      specialization TEXT DEFAULT 'General',
      notes TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      dob TEXT,
      blood_group TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      report_name TEXT NOT NULL,
      s3_key TEXT NOT NULL,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT (datetime('now'))
    );
  `);

  // Seed default admin (password: Admin@123)
  const existingAdmin = db.exec("SELECT id FROM users WHERE email='admin@hospital.com'");
  if (!existingAdmin.length || !existingAdmin[0].values.length) {
    const hashed = bcrypt.hashSync('Admin@123', 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)');
    stmt.run(['Admin', 'admin@hospital.com', hashed, 'admin']);
    stmt.free();
  }

  // Seed sample doctors so dropdown is never empty
  const existingDoctors = db.exec('SELECT id FROM doctors');
  if (!existingDoctors.length || !existingDoctors[0].values.length) {
    const sampleDoctors = [
      ['Dr. Anil Sharma',   'anil@hospital.com',   '9876543210', 'Cardiology'],
      ['Dr. Priya Mehta',   'priya@hospital.com',  '9876543211', 'Neurology'],
      ['Dr. Ravi Kumar',    'ravi@hospital.com',   '9876543212', 'Orthopedics'],
      ['Dr. Sunita Patel',  'sunita@hospital.com', '9876543213', 'Pediatrics'],
      ['Dr. Arjun Nair',    'arjun@hospital.com',  '9876543214', 'General Medicine'],
    ];
    const dStmt = db.prepare('INSERT INTO users (name, email, password, role, phone) VALUES (?,?,?,?,?)');
    const drStmt = db.prepare('INSERT INTO doctors (user_id, name, email, phone, specialization) VALUES (?,?,?,?,?)');
    const hashed = bcrypt.hashSync('Doctor@123', 10);
    for (const [name, email, phone, spec] of sampleDoctors) {
      dStmt.run([name, email, hashed, 'doctor', phone]);
      const uid = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      drStmt.run([uid, name, email, phone, spec]);
    }
    dStmt.free();
    drStmt.free();
  }

  persist();

  console.log('✅ SQLite database ready');
};

// Convert sql.js exec result → array of plain objects
const toRows = (result) => {
  if (!result || !result.length) return [];
  const { columns, values } = result[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
};

// Promise-compatible query — uses stmt.run(array) for correct ? binding
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const upper = sql.trim().toUpperCase();
      const stmt = db.prepare(sql);

      if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
        const rows = [];
        stmt.bind(params);
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        resolve([rows]);
      } else {
        stmt.run(params);
        stmt.free();
        const idResult = db.exec('SELECT last_insert_rowid() as id');
        const insertId = idResult[0]?.values[0][0] ?? null;
        resolve([{ insertId, affectedRows: 1 }]);
      }
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { query, initDB };
