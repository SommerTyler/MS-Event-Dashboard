(function () {
  const authRaw = localStorage.getItem("msAuth");
  if (!authRaw) {
    window.location.href = "./login.html";
    return;
  }

  const auth = JSON.parse(authRaw);
  const welcome = document.getElementById("welcome-user");
  const logoutBtn = document.getElementById("logout-btn");
  const stats = document.getElementById("stats");
  const eventBody = document.getElementById("event-body");
  const taskList = document.getElementById("task-list");
  const staffBody = document.getElementById("staff-body");
  const eventFilter = document.getElementById("event-filter");

  welcome.textContent = "Angemeldet: " + auth.name;

  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("msAuth");
    window.location.href = "./login.html";
  });

  const statData = [
    { title: "Events diese Woche", value: "9" },
    { title: "Verfuegbare Mitarbeiter", value: "24" },
    { title: "Krankmeldungen", value: "2" },
    { title: "Offene Aufgaben", value: "13" }
  ];

  const events = [
    { date: "08.04.2026", name: "Sommermesse Nord", city: "Hamburg", team: 8, status: "bestaetigt" },
    { date: "09.04.2026", name: "Firmenjubiläum W&T", city: "Berlin", team: 5, status: "planung" },
    { date: "11.04.2026", name: "VIP Gala Abend", city: "Muenchen", team: 10, status: "kritisch" },
    { date: "12.04.2026", name: "Roadshow ElektroX", city: "Hamburg", team: 7, status: "bestaetigt" }
  ];

  const tasks = [
    "Catering-Lieferung fuer Berlin final bestaetigen",
    "Ablaufplan fuer VIP Gala im Team teilen",
    "2 Ersatzkraefte fuer Hamburg disponieren",
    "Dienstplan fuer KW16 freigeben"
  ];

  const staff = [
    { name: "Lena Hoffmann", role: "Projektleitung", next: "08.04 Hamburg", status: "verfuegbar" },
    { name: "Murat Demir", role: "Technik", next: "09.04 Berlin", status: "unterwegs" },
    { name: "Sophie Klein", role: "Hostess Lead", next: "11.04 Muenchen", status: "knapp" },
    { name: "Jonas Richter", role: "Logistik", next: "12.04 Hamburg", status: "verfuegbar" }
  ];

  function statusBadge(status) {
    if (status === "bestaetigt" || status === "verfuegbar") {
      return '<span class="badge badge--gold">' + status + "</span>";
    }
    if (status === "planung" || status === "unterwegs") {
      return '<span class="badge badge--blue">' + status + "</span>";
    }
    return '<span class="badge badge--blue">' + status + "</span>";
  }

  function renderStats() {
    stats.innerHTML = "";
    statData.forEach(function (item) {
      const card = document.createElement("article");
      card.className = "card card--stat";
      card.innerHTML =
        '<p class="card--stat__number">' +
        item.value +
        '</p><p class="card--stat__label">' +
        item.title +
        "</p>";
      stats.appendChild(card);
    });
  }

  function renderEvents() {
    const selected = eventFilter.value;
    const filtered = events.filter(function (event) {
      return selected === "all" || event.city === selected;
    });

    eventBody.innerHTML = "";
    filtered.forEach(function (event) {
      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" +
        event.date +
        "</td><td>" +
        event.name +
        "</td><td>" +
        event.city +
        "</td><td>" +
        event.team +
        "</td><td>" +
        statusBadge(event.status) +
        "</td>";
      eventBody.appendChild(row);
    });
  }

  function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach(function (task) {
      const item = document.createElement("li");
      item.textContent = task;
      taskList.appendChild(item);
    });
  }

  function renderStaff() {
    staffBody.innerHTML = "";
    staff.forEach(function (person) {
      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" +
        person.name +
        "</td><td>" +
        person.role +
        "</td><td>" +
        person.next +
        "</td><td>" +
        statusBadge(person.status) +
        "</td>";
      staffBody.appendChild(row);
    });
  }

  eventFilter.addEventListener("change", renderEvents);

  renderStats();
  renderEvents();
  renderTasks();
  renderStaff();
})();
