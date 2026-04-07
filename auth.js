(async function() {
  const token = localStorage.getItem('ms_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('unauthorized');
    const data = await res.json();
    const user = data.user || {};
    document.getElementById('userName').textContent = user.name || 'Mitarbeiter';
    document.getElementById('userRole').textContent = user.role || '-';
  } catch {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    window.location.href = '/login.html';
    return;
  }

  const items = document.querySelectorAll('.reveal');
  items.forEach((it, idx) => {
    setTimeout(() => it.classList.add('in'), Math.min(idx * 120, 300));
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    window.location.href = '/login.html';
  });
})();
