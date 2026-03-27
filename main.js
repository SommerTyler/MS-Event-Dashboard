document.addEventListener('DOMContentLoaded', () => {
    // Theme Loading (Attribute is now set in <head> to prevent flash)
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) themeLabel.textContent = savedTheme === 'dark' ? 'Dark' : 'Light';

    // Helper to get CSS Variables for Charts
    function getCssVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#94a3b8';
    }

    let revenueChart, sourceChart;

    function initCharts() {
        Chart.defaults.font.family = "'Geist Mono', monospace";
        Chart.defaults.color = getCssVar('--muted');
        
        const revenueEl = document.getElementById('revenueChart');
        if (revenueEl) {
            const ctxRevenue = revenueEl.getContext('2d');
            const gradientRevenue = ctxRevenue.createLinearGradient(0, 0, 0, 400);
            
            let accentMatch = getCssVar('--accent');
            
            gradientRevenue.addColorStop(0, accentMatch + '55'); // approx 30% alpha if hex
            gradientRevenue.addColorStop(1, accentMatch + '00');

            revenueChart = new Chart(ctxRevenue, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
                    datasets: [{
                        label: 'Monatlicher Umsatz (€)',
                        data: [30000, 35000, 32000, 40000, 45000, 48000, 50000, 45000, 52000, 58000, 60000, 65000],
                        borderColor: accentMatch,
                        backgroundColor: gradientRevenue,
                        borderWidth: 3,
                        pointBackgroundColor: accentMatch,
                        pointBorderColor: getCssVar('--surface'),
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: getCssVar('--surface'),
                            titleColor: getCssVar('--text'),
                            bodyColor: getCssVar('--text'),
                            borderColor: getCssVar('--border'),
                            borderWidth: 1,
                            displayColors: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: getCssVar('--border'), drawBorder: false },
                            ticks: { callback: function(v) { return '€' + v/1000 + 'k'; } }
                        },
                        x: {
                            grid: { display: false, drawBorder: false }
                        }
                    }
                }
            });
        }

        const sourceEl = document.getElementById('sourceChart');
        if (sourceEl) {
            const ctxSource = sourceEl.getContext('2d');
            sourceChart = new Chart(ctxSource, {
                type: 'doughnut',
                data: {
                    labels: ['Organische Suche', 'Direkt', 'Social Media', 'Referral'],
                    datasets: [{
                        data: [45, 25, 20, 10],
                        backgroundColor: [
                            getCssVar('--accent'),
                            getCssVar('--low'),
                            getCssVar('--mid'),
                            getCssVar('--sugg')
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
                        },
                        tooltip: {
                            backgroundColor: getCssVar('--surface'),
                            padding: 10,
                            borderColor: getCssVar('--border'),
                            borderWidth: 1,
                        }
                    }
                }
            });
        }
    }

    // Refresh charts on theme flip
    function updateChartColors() {
        if (revenueChart) revenueChart.destroy();
        if (sourceChart) sourceChart.destroy();
        setTimeout(initCharts, 50); // slight delay to allow CSS vars to update dom
    }

    // Initialize 
    setTimeout(initCharts, 100);

    // Theme Toggle Logic
    const toggleBtn = document.getElementById('theme-toggle-btn');
    toggleBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const nxt = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nxt);
        document.getElementById('theme-label').textContent = nxt === 'dark' ? 'Dark' : 'Light';
        localStorage.setItem('theme', nxt);
        updateChartColors();
    });

    // --- Personal Page Modals Logic (Database Integrated) ---
    if (document.getElementById('rolesTable') && document.getElementById('employeesTable')) {
        const roleModal = document.getElementById('roleModal');
        const employeeModal = document.getElementById('employeeModal');
        
        async function fetchRoles() {
            try {
                const res = await fetch('/api/roles');
                if(!res.ok) return;
                const roles = await res.json();
                const tbody = document.getElementById('rolesTable').querySelector('tbody');
                tbody.innerHTML = '';
                const ds = document.getElementById('employeeRoleInput');
                ds.innerHTML = '';
                roles.forEach(r => {
                    ds.add(new Option(r.name, r.name));
                    const tr = document.createElement('tr');
                    tr.setAttribute('data-id', r.id);
                    tr.innerHTML = `
                        <td class="font-medium role-name">${r.name}</td>
                        <td class="role-perms"><span class="sys-badge badge-offen" style="margin-bottom: 4px;">Zugewiesen</span><br><span class="text-muted perms-detail" style="font-size: 11px;">${r.perms}</span></td>
                        <td class="font-mono role-salary">${r.salary}</td>
                        <td><button class="btn btn-ghost btn-edit-role" style="padding: 4px 8px;"><i class="fa-solid fa-pen"></i></button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (e) {
                console.log("No DB connected, using static UI");
            }
        }
        
        async function fetchEmployees() {
            try {
                const res = await fetch('/api/employees');
                if(!res.ok) return;
                const emps = await res.json();
                const tbody = document.getElementById('employeesTable').querySelector('tbody');
                tbody.innerHTML = '';
                emps.forEach((emp, idx) => {
                    const tr = document.createElement('tr');
                    tr.setAttribute('data-id', emp.id);
                    const badgeClass = emp.status === 'Aktiv' ? 'badge-erledigt' : 'badge-abgebrochen';
                    tr.innerHTML = `
                        <td>
                            <div class="customer-cell">
                                <img src="https://i.pravatar.cc/150?img=${(emp.id * 10) % 70}" alt="Avatar">
                                <span class="emp-name">${emp.name}</span>
                            </div>
                        </td>
                        <td class="text-muted emp-role">${emp.role}</td>
                        <td class="text-muted">${emp.lastActive}</td>
                        <td class="emp-status"><span class="sys-badge ${badgeClass}">${emp.status}</span></td>
                        <td><button class="btn btn-ghost btn-edit-emp" style="padding: 4px 8px;"><i class="fa-solid fa-pen"></i></button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (e) { }
        }

        fetchRoles();
        fetchEmployees();

        const closeModals = () => { roleModal.classList.remove('show'); employeeModal.classList.remove('show'); };
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => { if(e.target === el || el.classList.contains('modal-close')) closeModals(); });
        });
        document.getElementById('cancelRoleModal').addEventListener('click', closeModals);
        document.getElementById('cancelEmployeeModal').addEventListener('click', closeModals);

        // Roles
        document.getElementById('btnAddRole').addEventListener('click', () => {
            document.getElementById('roleModalTitle').textContent = 'Neue Rolle';
            document.getElementById('editRoleIndex').value = '-1';
            document.getElementById('roleNameInput').value = '';
            document.getElementById('rolePermsInput').value = '';
            document.getElementById('roleSalaryInput').value = '';
            roleModal.classList.add('show');
        });

        document.getElementById('rolesTable').addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit-role')) {
                const tr = e.target.closest('tr');
                document.getElementById('roleModalTitle').textContent = 'Rolle bearbeiten';
                document.getElementById('editRoleIndex').value = tr.getAttribute('data-id') || '-1';
                document.getElementById('roleNameInput').value = tr.querySelector('.role-name').textContent;
                const detail = tr.querySelector('.perms-detail') ? tr.querySelector('.perms-detail').textContent : '';
                document.getElementById('rolePermsInput').value = detail;
                const salaryStr = tr.querySelector('.role-salary').textContent;
                document.getElementById('roleSalaryInput').value = salaryStr.replace('€', '').replace(/,/g, '').trim();
                roleModal.classList.add('show');
            }
        });

        document.getElementById('saveRoleBtn').addEventListener('click', async () => {
            const dbId = document.getElementById('editRoleIndex').value;
            const name = document.getElementById('roleNameInput').value || 'Neu';
            const perms = document.getElementById('rolePermsInput').value || '-';
            let num = parseFloat(document.getElementById('roleSalaryInput').value) || 0;
            const salary = '€' + num.toLocaleString('en-US', {minimumFractionDigits: 2});

            if (dbId !== '-1') {
                await fetch('/api/roles/' + dbId, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, perms, salary})
                });
            } else {
                await fetch('/api/roles', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, perms, salary})
                });
            }
            closeModals();
            fetchRoles();
        });

        // Employees
        document.getElementById('btnAddEmployee').addEventListener('click', () => {
            document.getElementById('employeeModalTitle').textContent = 'Neuer Mitarbeiter';
            document.getElementById('editEmployeeIndex').value = '-1';
            document.getElementById('employeeNameInput').value = '';
            employeeModal.classList.add('show');
        });

        document.getElementById('employeesTable').addEventListener('click', (e) => {
            if (e.target.closest('.btn-edit-emp')) {
                const tr = e.target.closest('tr');
                document.getElementById('employeeModalTitle').textContent = 'Mitarbeiter bearbeiten';
                document.getElementById('editEmployeeIndex').value = tr.getAttribute('data-id') || '-1';
                document.getElementById('employeeNameInput').value = tr.querySelector('.emp-name').textContent;
                
                const role = tr.querySelector('.emp-role').textContent.trim();
                const sel = document.getElementById('employeeRoleInput');
                if(!Array.from(sel.options).some(o=>o.text===role)) sel.add(new Option(role,role));
                for(let i=0;i<sel.options.length;i++) if(sel.options[i].text===role) sel.selectedIndex=i;
                
                const status = tr.querySelector('.emp-status').textContent.trim();
                const statusSel = document.getElementById('employeeStatusInput');
                for(let i=0;i<statusSel.options.length;i++) if(statusSel.options[i].text===status) statusSel.selectedIndex=i;
                
                employeeModal.classList.add('show');
            }
        });

        document.getElementById('saveEmployeeBtn').addEventListener('click', async () => {
            const dbId = document.getElementById('editEmployeeIndex').value;
            const name = document.getElementById('employeeNameInput').value || 'Unbekannt';
            const ds = document.getElementById('employeeRoleInput');
            const role = ds.options[ds.selectedIndex]?.text || '';
            const ss = document.getElementById('employeeStatusInput');
            const status = ss.options[ss.selectedIndex].text;
            
            if (dbId !== '-1') {
                await fetch('/api/employees/' + dbId, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, role, status})
                });
            } else {
                await fetch('/api/employees', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name, role, status, lastActive: 'Gerade eben'})
                });
            }
            closeModals();
            fetchEmployees();
        });
    }
});
