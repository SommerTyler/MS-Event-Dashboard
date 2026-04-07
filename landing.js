async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

function statItem(value, label) {
  return `<div class="lp-stat"><strong data-count="${value}">${value}</strong><span>${label}</span></div>`;
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
    const [stats, services, refs, team] = await Promise.all([
      fetchJson('/api/landing/stats'),
      fetchJson('/api/landing/services'),
      fetchJson('/api/landing/references'),
      fetchJson('/api/landing/team')
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

    document.getElementById('teamGrid').innerHTML = team.map(m => `
      <article class="card lp-member">
        <img src="${m.avatar}" alt="${m.name}">
        <div>
          <h4>${m.name}</h4>
          <p>${m.role}</p>
        </div>
      </article>
    `).join('');

    startCountUp();
    initReveal();
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

function startCountUp() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  document.querySelectorAll('[data-count]').forEach(el => {
    const raw = el.getAttribute('data-count');
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    const target = Number(digits);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 50));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = raw.replace(digits, String(current));
    }, 20);
  });
}

function initReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.lp-reveal');
  if (prefersReduced) {
    items.forEach(i => i.classList.add('in'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((item, idx) => {
    item.style.transitionDelay = `${Math.min(idx * 35, 220)}ms`;
    obs.observe(item);
  });
}

function initCookieBanner() {
  const key = 'ms_cookie_ok';
  const banner = document.getElementById('cookieBanner');
  if (localStorage.getItem(key) === '1') {
    banner.style.display = 'none';
    return;
  }
  document.getElementById('cookieAccept').addEventListener('click', () => {
    localStorage.setItem(key, '1');
    banner.style.display = 'none';
  });
  document.getElementById('cookieClose').addEventListener('click', () => {
    banner.style.display = 'none';
  });
}

document.getElementById('calcBtn').addEventListener('click', calculateOffer);
document.getElementById('registerReferralBtn').addEventListener('click', registerReferral);
loadLanding();
initCookieBanner();
