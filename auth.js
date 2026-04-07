(function () {
  const form = document.getElementById("login-form");
  if (!form) return;

  const errorElement = document.getElementById("error");
  const validUser = {
    email: "admin@ms-events.de",
    password: "event2026",
    name: "Leitung Disposition"
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (email === validUser.email && password === validUser.password) {
      localStorage.setItem(
        "msAuth",
        JSON.stringify({ email: validUser.email, name: validUser.name })
      );
      window.location.href = "./dashboard.html";
      return;
    }

    errorElement.textContent = "Login fehlgeschlagen. Bitte Zugangsdaten pruefen.";
  });
})();
