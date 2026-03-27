const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'ms-dashboard-secret-2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = new sqlite3.Database('./dashboard.db', (err) => {
    if (err) { console.error("DB Connection error:", err); return; }
    console.log("Connected to SQLite database.");

    db.serialize(() => {
        // Roles
        db.run(`CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, perms TEXT, salary TEXT, rank INTEGER
        )`, () => {
            db.get("SELECT count(*) as count FROM roles", (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO roles (name, perms, salary, rank) VALUES 
                        ('Geschäftsleitung', 'Vollzugriff, Alle Seiten, Strategie', '€8,500.00', 12),
                        ('Stlv. Geschäftsleitung', 'Vollzugriff, Alle Seiten, Vertretung', '€7,200.00', 11),
                        ('Sekretär der GL', 'GL-Zugriff, Dokumentenmanagement', '€4,500.00', 10),
                        ('Abteilungsleitung', 'Abteilungszugriff, Personalplanung', '€5,800.00', 9),
                        ('Stlv. Abteilungsleitung', 'Abteilungszugriff, Vertretung', '€5,100.00', 8),
                        ('Senior Leitender Angestellter', 'Teamleitung, Projektmanagement', '€4,800.00', 7),
                        ('Leitender Angestellter', 'Teamleitung, Fachverantwortung', '€4,200.00', 6),
                        ('Junior Leitender Angestellter', 'Assistenz Teamleitung, Einarbeitung', '€3,600.00', 5),
                        ('Senior Angestellter', 'Fachspezialist, Eigenverantwortung', '€3,800.00', 4),
                        ('Junior Angestellter', 'Fachkraft, Unterstützung', '€2,800.00', 3),
                        ('Auszubildender', 'Ausbildung, Unterstützung', '€1,100.00', 2),
                        ('Praktikant', 'Einarbeitung, Unterstützung', '€800.00', 1)`);
                }
            });
        });

        // Employees
        db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, role TEXT, status TEXT, lastActive TEXT
        )`, () => {
            db.get("SELECT count(*) as count FROM employees", (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO employees (name, role, status, lastActive) VALUES 
                        ('Max Mustermann', 'Admin', 'Aktiv', 'Gerade eben'),
                        ('Anna Meier', 'Editor', 'Aktiv', 'Gestern, 14:30'),
                        ('Sarah Schmidt', 'Viewer', 'Inaktiv', 'Vor 3 Tagen')`);
                }
            });
        });

        // Users (for login)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            passwordHash TEXT NOT NULL,
            role TEXT NOT NULL,
            rank INTEGER DEFAULT 1,
            avatar TEXT
        )`, () => {
            db.get("SELECT count(*) as count FROM users", (err, row) => {
                if (row && row.count === 0) {
                    const users = [
                        { name: 'Max Mustermann', email: 'admin@ms-dashboard.de', password: 'admin123', role: 'Geschäftsleitung', rank: 12, avatar: 'https://i.pravatar.cc/150?img=11' },
                        { name: 'Anna Meier', email: 'editor@ms-dashboard.de', password: 'editor123', role: 'Abteilungsleitung', rank: 9, avatar: 'https://i.pravatar.cc/150?img=33' },
                        { name: 'Sarah Schmidt', email: 'viewer@ms-dashboard.de', password: 'viewer123', role: 'Praktikant', rank: 1, avatar: 'https://i.pravatar.cc/150?img=5' }
                    ];
                    users.forEach(u => {
                        const hash = bcrypt.hashSync(u.password, 10);
                        db.run(`INSERT INTO users (name, email, passwordHash, role, rank, avatar) VALUES (?,?,?,?,?,?)`,
                            [u.name, u.email, hash, u.role, u.rank, u.avatar]);
                    });
                    console.log("Default users seeded.");
                }
            });
        });

        // Projects
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, customer TEXT, eventType TEXT, eventDate TEXT,
            guestCount INTEGER, location TEXT, budget TEXT, notes TEXT,
            status TEXT DEFAULT 'draft', createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // Todos
        db.run(`CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId INTEGER, title TEXT, isCompleted INTEGER DEFAULT 0,
            FOREIGN KEY(projectId) REFERENCES projects(id)
        )`);

        // Updates (Change Log)
        db.run(`CREATE TABLE IF NOT EXISTS updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            db.get("SELECT count(*) as count FROM updates", (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO updates (text) VALUES ('V1.0 - Dashboard erfolgreich gelauncht!')`);
                    db.run(`INSERT INTO updates (text) VALUES ('Neues Ankündigungssystem integriert.')`);
                    db.run(`INSERT INTO updates (text) VALUES ('Home-Seite mit persönlicher Übersicht hinzugefügt.')`);
                }
            });
        });

        // Announcements
        db.run(`CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            authorName TEXT, authorRole TEXT, text TEXT, createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            db.get("SELECT count(*) as count FROM announcements", (err, row) => {
                if (row && row.count === 0) {
                    db.run(`INSERT INTO announcements (authorName, authorRole, text) VALUES ('MS System', 'Automatisierung', 'Willkommen im neuen Ankündigungs-Feed!')`);
                }
            });
        });
    });
});

// ─── AUTH MIDDLEWARE ───
function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    try {
        req.user = jwt.verify(auth.slice(7), JWT_SECRET);
        next();
    } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── AUTH ROUTES ───
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email und Passwort erforderlich' });
    db.get("SELECT * FROM users WHERE email=?", [email.toLowerCase().trim()], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
        if (!bcrypt.compareSync(password, user.passwordHash))
            return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, rank: user.rank, avatar: user.avatar }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, rank: user.rank, avatar: user.avatar } });
    });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// ─── ROLES ───
app.get('/api/roles', (req, res) => {
    db.all("SELECT * FROM roles", [], (err, rows) => { if (err) res.status(500).json({error: err.message}); else res.json(rows); });
});
app.post('/api/roles', (req, res) => {
    const {name, perms, salary} = req.body;
    db.run(`INSERT INTO roles (name, perms, salary) VALUES (?,?,?)`, [name, perms, salary], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({id: this.lastID, name, perms, salary});
    });
});
app.put('/api/roles/:id', (req, res) => {
    const {name, perms, salary} = req.body;
    db.run(`UPDATE roles SET name=?, perms=?, salary=? WHERE id=?`, [name, perms, salary, req.params.id], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({updated: this.changes});
    });
});

// ─── EMPLOYEES ───
app.get('/api/employees', (req, res) => {
    db.all("SELECT * FROM employees", [], (err, rows) => { if (err) res.status(500).json({error: err.message}); else res.json(rows); });
});
app.post('/api/employees', (req, res) => {
    const {name, role, status, lastActive} = req.body;
    db.run(`INSERT INTO employees (name, role, status, lastActive) VALUES (?,?,?,?)`, [name, role, status, lastActive], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({id: this.lastID, name, role, status, lastActive});
    });
});
app.put('/api/employees/:id', (req, res) => {
    const {name, role, status} = req.body;
    db.run(`UPDATE employees SET name=?, role=?, status=? WHERE id=?`, [name, role, status, req.params.id], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({updated: this.changes});
    });
});

// ─── PROJECTS ───
app.get('/api/projects', (req, res) => {
    db.all("SELECT * FROM projects ORDER BY createdAt DESC", [], (err, rows) => { if (err) res.status(500).json({error: err.message}); else res.json(rows); });
});
app.get('/api/projects/:id', (req, res) => {
    db.get("SELECT * FROM projects WHERE id=?", [req.params.id], (err, row) => { if (err) res.status(500).json({error: err.message}); else res.json(row); });
});
app.post('/api/projects', (req, res) => {
    const {name, customer, eventType, eventDate, guestCount, location, budget, notes} = req.body;
    db.run(`INSERT INTO projects (name, customer, eventType, eventDate, guestCount, location, budget, notes, status) VALUES (?,?,?,?,?,?,?,?,'draft')`,
        [name||'Neues Projekt', customer||'', eventType||'', eventDate||'', guestCount||0, location||'', budget||'', notes||''],
        function(err) { if (err) res.status(500).json({error: err.message}); else res.json({id: this.lastID}); });
});
app.put('/api/projects/:id', (req, res) => {
    const {name, customer, eventType, eventDate, guestCount, location, budget, notes, status} = req.body;
    db.run(`UPDATE projects SET name=?, customer=?, eventType=?, eventDate=?, guestCount=?, location=?, budget=?, notes=?, status=? WHERE id=?`,
        [name, customer, eventType, eventDate, guestCount, location, budget, notes, status, req.params.id],
        function(err) { if (err) res.status(500).json({error: err.message}); else res.json({updated: this.changes}); });
});
app.delete('/api/projects/:id', (req, res) => {
    db.run(`DELETE FROM todos WHERE projectId=?`, [req.params.id], () => {
        db.run(`DELETE FROM projects WHERE id=?`, [req.params.id], function(err) {
            if (err) res.status(500).json({error: err.message}); else res.json({deleted: this.changes});
        });
    });
});

// ─── TODOS ───
app.get('/api/projects/:id/todos', (req, res) => {
    db.all("SELECT * FROM todos WHERE projectId=? ORDER BY id ASC", [req.params.id], (err, rows) => { if (err) res.status(500).json({error: err.message}); else res.json(rows); });
});
app.post('/api/projects/:id/todos', (req, res) => {
    const {title} = req.body;
    db.run(`INSERT INTO todos (projectId, title) VALUES (?,?)`, [req.params.id, title], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({id: this.lastID, projectId: req.params.id, title, isCompleted: 0});
    });
});
app.post('/api/projects/:id/todos/bulk', (req, res) => {
    const {todos} = req.body;
    const stmt = db.prepare(`INSERT INTO todos (projectId, title) VALUES (?,?)`);
    todos.forEach(t => stmt.run([req.params.id, t]));
    stmt.finalize(err => { if (err) res.status(500).json({error: err.message}); else res.json({inserted: todos.length}); });
});
app.put('/api/todos/:id', (req, res) => {
    const {isCompleted} = req.body;
    db.run(`UPDATE todos SET isCompleted=? WHERE id=?`, [isCompleted ? 1 : 0, req.params.id], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({updated: this.changes});
    });
});

// ─── UPDATES ───
app.get('/api/updates', (req, res) => {
    db.all("SELECT * FROM updates ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) res.status(500).json({error: err.message}); else res.json(rows);
    });
});

// ─── ANNOUNCEMENTS ───
app.get('/api/announcements', (req, res) => {
    db.all("SELECT * FROM announcements ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) res.status(500).json({error: err.message}); else res.json(rows);
    });
});
app.post('/api/announcements', authMiddleware, (req, res) => {
    const {text} = req.body;
    if (req.user.rank < 10) return res.status(403).json({error: 'Berichtigung nicht ausreichend (Rang 10+ erforderlich).'});
    db.run(`INSERT INTO announcements (authorName, authorRole, text) VALUES (?,?,?)`, [req.user.name, req.user.role, text], function(err) {
        if (err) res.status(500).json({error: err.message}); else res.json({id: this.lastID, authorName: req.user.name, authorRole: req.user.role, text, createdAt: new Date()});
    });
});

app.listen(PORT, () => console.log(`MS Dashboard Server running at http://localhost:${PORT}`));
