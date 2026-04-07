const q = (s) => document.querySelector(s);

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error('request failed');
  return res.json();
}

function renderStats(stats) {
  q('#statsGrid').innerHTML = [
    ['Events geplant', stats.eventsPlanned],
    ['Umsatz generiert', stats.revenueGenerated],
    ['Kundenzufriedenheit', stats.customerSatisfaction],
    ['Support', stats.supportRate]
  ].map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
}

function renderCards(selector, data, mapFn) {
  q(selector).innerHTML = data.map(mapFn).join('');
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return items.forEach((it) => it.classList.add('in'));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((it, i) => {
    it.style.transitionDelay = `${Math.min(i * 45, 240)}ms`;
    observer.observe(it);
  });
}

async function init() {
  const [stats, services, refs, team] = await Promise.all([
    fetchJson('/api/landing/stats'),
    fetchJson('/api/landing/services'),
    fetchJson('/api/landing/references'),
    fetchJson('/api/landing/team')
  ]);

  renderStats(stats);
  renderCards('#servicesGrid', services, (s) => `<article class="card glass"><h3>${s.title}</h3><p>${s.description}</p></article>`);
  renderCards('#refsGrid', refs, (r) => `<article class="card glass"><span class="badge">${r.eventTypeLabel}</span><h3>${r.title}</h3><p>${r.description}</p><p class="copy">${r.guests} Gäste</p></article>`);
  renderCards('#teamGrid', team, (m) => `<article class="card glass team"><img src="${m.avatar}" alt="${m.name}"><div><h3>${m.name}</h3><p class="role">${m.role}</p></div></article>`);
  initReveal();
}

q('#calcBtn').addEventListener('click', async () => {
  const eventType = q('#calcType').value;
  const guests = Number(q('#calcGuests').value) || 10;
  const result = await fetchJson('/api/landing/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, guests })
  });
  q('#calcOut').textContent = `Unverbindliche Schätzung: ${result.totalFormatted} · ${result.note}`;
});

init().catch(console.error);
