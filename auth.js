/**
 * auth.js — Runs on every protected page.
 * Checks the JWT token, redirects to login if invalid,
 * and populates the header with the logged-in user's info.
 */
(function() {
  const token = localStorage.getItem('ms_token');
  const cachedUser = localStorage.getItem('ms_user');

  // No token at all → redirect immediately
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  // Populate header immediately from cache (fast, no flicker)
  if (cachedUser) {
    try { applyUser(JSON.parse(cachedUser)); } catch(e) {}
  }

  // Verify token with backend in background
  fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(res => {
      if (!res.ok) {
        localStorage.removeItem('ms_token');
        localStorage.removeItem('ms_user');
        window.location.href = '/login.html';
        return;
      }
      return res.json();
    })
    .then(data => {
      if (data && data.user) {
        localStorage.setItem('ms_user', JSON.stringify(data.user));
        applyUser(data.user);
      }
    })
    .catch(() => {
      // Server unreachable — keep going with cached user, don't log out
    });

  function applyUser(user) {
    // Avatar
    const avatarEl = document.querySelector('.avatar');
    if (avatarEl && user.avatar) avatarEl.src = user.avatar;

    // Name & Role in header
    const nameEl = document.querySelector('.profile-text .name');
    const roleEl = document.querySelector('.profile-text .role');
    if (nameEl) nameEl.textContent = user.name || '';
    if (roleEl) roleEl.textContent = user.role || '';

    // Make profile clickable for logout menu
    const profile = document.querySelector('.profile');
    if (profile && !profile.dataset.authBound) {
      profile.dataset.authBound = '1';
      profile.style.cursor = 'pointer';
      profile.title = 'Klicken zum Abmelden';
      profile.addEventListener('click', () => {
        if (confirm('Möchtest du dich wirklich abmelden?')) {
          localStorage.removeItem('ms_token');
          localStorage.removeItem('ms_user');
          localStorage.removeItem('activeProjectId');
          window.location.href = '/login.html';
        }
      });
    }
  }
})();
