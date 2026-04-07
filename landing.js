async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

function statItem(value, label) {
  return `<div class="lp-stat"><strong>${value}</strong><span>${label}</span></div>`;
}

function eventBadge(type) {
  const map = {
    wedding: 'badge-erledigt',
    street_race: 'badge-offen',
    corporate: 'badge-sugg',
    vip: 'badge-abgebrochen'
  };
  return map[type] || 'badge-offen';
}

async function loadLanding() {
  try {
    const [stats, services, refs] = await Promise.all([
      fetchJson('/api/landing/stats'),
      fetchJson('/api/landing/services'),
      fetchJson('/api/landing/references')
    ]);

    document.getElementById('statsGrid').innerHTML = [
      statItem(stats.eventsPlanned, 'Events geplant'),
      statItem(stats.revenueGenerated, 'Umsatz generiert'),
      statItem(stats.customerSatisfaction, 'Kundenzufriedenheit'),
      statItem(stats.supportRate, 'Support')
    ].join('');

    document.getElementById('servicesGrid').innerHTML = services.map(s => `
      <article class="card lp-service">
        <h3>${s.title}</h3>
        <p>${s.description}</p>
      </article>
    `).join('');

    document.getElementById('eventGrid').innerHTML = refs.map(r => `
      <article class="card lp-event">
        <span class="sys-badge ${eventBadge(r.eventType)}">${r.eventTypeLabel}</span>
        <h3>${r.title}</h3>
        <p>${r.description}</p>
        <div class="u-table-note">${r.guests} Gäste</div>
      </article>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function calculateOffer() {
  const eventType = document.getElementById('calcType').value;
  const guests = parseInt(document.getElementById('calcGuests').value, 10) || 0;
  const result = document.getElementById('calcResult');
  try {
    const data = await fetchJson('/api/landing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, guests })
    });
    result.textContent = `Unverbindliche Schätzung: ${data.totalFormatted} (${data.note})`;
  } catch {
    result.textContent = 'Angebot konnte gerade nicht berechnet werden.';
  }
}

async function registerReferral() {
  const recommender = prompt('Dein Charaktername (Vor- und Nachname):');
  if (!recommender) return;
  const referred = prompt('Name deines Freundes:');
  if (!referred) return;
  try {
    await fetchJson('/api/landing/referral-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommender, referred })
    });
    alert('Referral erfolgreich registriert.');
  } catch {
    alert('Konnte nicht gespeichert werden.');
  }
}

document.getElementById('calcBtn').addEventListener('click', calculateOffer);
document.getElementById('registerReferralBtn').addEventListener('click', registerReferral);
loadLanding();
