const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./dashboard.db');

const newRoles = [
  { name: 'Geschäftsleitung', perms: 'Vollzugriff, Alle Seiten, Strategie', salary: '€8,500.00' },
  { name: 'Stlv. Geschäftsleitung', perms: 'Vollzugriff, Alle Seiten, Vertretung', salary: '€7,200.00' },
  { name: 'Sekretär der GL', perms: 'GL-Zugriff, Dokumentenmanagement', salary: '€4,500.00' },
  { name: 'Abteilungsleitung', perms: 'Abteilungszugriff, Personalplanung', salary: '€5,800.00' },
  { name: 'Stlv. Abteilungsleitung', perms: 'Abteilungszugriff, Vertretung', salary: '€5,100.00' },
  { name: 'Senior Leitender Angestellter', perms: 'Teamleitung, Projektmanagement', salary: '€4,800.00' },
  { name: 'Leitender Angestellter', perms: 'Teamleitung, Fachverantwortung', salary: '€4,200.00' },
  { name: 'Junior Leitender Angestellter', perms: 'Assistenz Teamleitung, Einarbeitung', salary: '€3,600.00' },
  { name: 'Senior Angestellter', perms: 'Fachspezialist, Eigenverantwortung', salary: '€3,800.00' },
  { name: 'Junior Angestellter', perms: 'Fachkraft, Unterstützung', salary: '€2,800.00' },
  { name: 'Auszubildender', perms: 'Ausbildung, Unterstützung', salary: '€1,100.00' },
  { name: 'Praktikant', perms: 'Einarbeitung, Unterstützung', salary: '€800.00' }
];

db.serialize(() => {
  console.log("Clearing existing roles...");
  db.run("DELETE FROM roles");
  
  const stmt = db.prepare("INSERT INTO roles (name, perms, salary) VALUES (?, ?, ?)");
  newRoles.forEach(r => {
    stmt.run(r.name, r.perms, r.salary);
    console.log(`Inserted role: ${r.name}`);
  });
  stmt.finalize();
});

db.close((err) => {
  if (err) console.error(err.message);
  console.log('Database roles updated successfully.');
});
