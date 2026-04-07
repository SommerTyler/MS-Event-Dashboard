const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'restart-glass-blue-secret';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const db = new sqlite3.Database('./dashboard.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT NOT NULL
  )`);

  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) return;
    if (row.count === 0) {
      const users = [
        ['Mia Stein', 'admin@ms-dashboard.de', bcrypt.hashSync('admin123', 10), 'Event Director', 'https://i.pravatar.cc/150?img=47'],
        ['Noah Krause', 'ops@ms-dashboard.de', bcrypt.hashSync('ops123', 10), 'Operations Lead', 'https://i.pravatar.cc/150?img=15'],
        ['Sophie Werner', 'vip@ms-dashboard.de', bcrypt.hashSync('vip123', 10), 'VIP & Security Lead', 'https://i.pravatar.cc/150?img=32']
      ];
      const stmt = db.prepare('INSERT INTO users (name, email, passwordHash, role, avatar) VALUES (?,?,?,?,?)');
      users.forEach((u) => stmt.run(u));
      stmt.finalize();
    }
  });
});

const landingStats = { eventsPlanned: '128', revenueGenerated: 'EUR 3.4M', customerSatisfaction: '99%', supportRate: '24/7' };
const landingServices = [
  { id: 1, title: 'Hochzeiten & Zeremonien', description: 'Von der Tischkarte bis zum Feuerwerk - wir planen euren Tag bis ins Detail.' },
  { id: 2, title: 'Straßenrennen & Races', description: 'Streckenplanung, Security, Timing und Show-Produktion aus einer Hand.' },
  { id: 3, title: 'Security & VIP-Events', description: 'Premium-Zugänge, Escort-Setup und diskrete Sicherheitskoordination.' },
  { id: 4, title: 'Corporate & Firmenfeiern', description: 'Business-Events mit klarer Dramaturgie und hochwertiger Umsetzung.' },
  { id: 5, title: 'Schnitzeljagden', description: 'City-wide Formate mit bis zu 200 Teilnehmern und Live-Regie.' },
  { id: 6, title: 'Team-Events & Partys', description: 'Private Nights, Team-Erlebnisse und maßgeschneiderte Eventkonzepte.' }
];
const landingReferences = [
  { id: 1, eventTypeLabel: 'WEDDING', title: 'Hochzeit am Vinewood Hills', description: 'Luxushochzeit mit Sunset-Dinner und Private Afterparty.', guests: 80 },
  { id: 2, eventTypeLabel: 'STREET RACE', title: 'Midnight Blaze Cup', description: 'High-energy Race Night mit Live-Kommentar und VIP-Lounge.', guests: 175 },
  { id: 3, eventTypeLabel: 'CORPORATE', title: 'Corporate Gala - Maze Bank Tower', description: 'Exklusive Business-Gala im 71. Stock mit Premium Catering.', guests: 120 }
];
const landingTeam = [
  { id: 1, name: 'Mia Stein', role: 'Event Director', avatar: 'https://i.pravatar.cc/150?img=47' },
  { id: 2, name: 'Noah Krause', role: 'Operations Lead', avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: 3, name: 'Sophie Werner', role: 'VIP & Security Lead', avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: 4, name: 'Luca Hartmann', role: 'Race Coordination', avatar: 'https://i.pravatar.cc/150?img=12' }
];

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'landing.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email und Passwort erforderlich' });
  db.get('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
    if (!bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role, avatar: user.avatar }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar } });
  });
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));
app.get('/api/landing/stats', (_, res) => res.json(landingStats));
app.get('/api/landing/services', (_, res) => res.json(landingServices));
app.get('/api/landing/references', (_, res) => res.json(landingReferences));
app.get('/api/landing/team', (_, res) => res.json(landingTeam));

app.post('/api/landing/calculate', (req, res) => {
  const guests = Math.max(10, Number(req.body.guests) || 10);
  const type = req.body.eventType || 'wedding';
  const base = { wedding: 4200, street_race: 6200, corporate: 5400, vip: 7600 }[type] || 5000;
  const perGuest = type === 'street_race' ? 24 : 18;
  const total = base + guests * perGuest;
  res.json({ totalFormatted: `EUR ${total.toLocaleString('de-DE')}`, note: `${type} mit ${guests} Gästen` });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

