const homeData = {
    searchItems: [
        { type: 'Hospital', name: 'City PHC Center' },
        { type: 'Doctor', name: 'Dr. Shah' },
        { type: 'Medicine', name: 'Insulin' },
        { type: 'Hospital', name: 'Rural CHC Unit' }
    ],
    modules: [
        { title: 'Medicine Stock', desc: 'Track stock levels, expiry alerts, and reorder needs instantly.', link: 'pages/medicine-stock.html' },
        { title: 'Patient Flow', desc: 'Understand rush hours, registrations, and consultation demand.', link: 'pages/patient-flow.html' },
        { title: 'Bed Availability', desc: 'Monitor ICU, general, and pediatric bed occupancy live.', link: 'pages/bed-availability.html' },
        { title: 'Doctor Attendance', desc: 'Stay on top of punctuality, shifts, and patient coverage.', link: 'pages/doctor-attendance.html' }
    ],
    roles: [
        { title: 'Admin', desc: 'Manage hospitals, doctors, patients, medicines, beds, reports, and alerts.' },
        { title: 'Doctor', desc: 'View appointments, add diagnosis, prescribe medicines, and mark attendance.' },
        { title: 'Patient', desc: 'Search hospitals, book appointments, check availability, and request emergency support.' },
        { title: 'Pharmacist', desc: 'Update stock, remove expired medicines, and manage low-stock alerts.' }
    ],
    features: [
        { title: 'Medicine Prediction', desc: 'Forecast shortages and prepare required stock levels before depletion.' },
        { title: 'Footfall Prediction', desc: 'Predict rush periods to improve staff allocation and queue management.' },
        { title: 'Bed Prediction', desc: 'Estimate occupancy and emergency bed needs in advance.' },
        { title: 'Attendance Analysis', desc: 'Track attendance %, late arrivals, and leave history.' },
        { title: 'AI Chat Assistant', desc: 'Answer questions like “Which hospital has beds?” instantly.' }
    ],
    feed: [
        '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">emergency</span> Emergency ambulance request raised for a critical patient',
        '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">notifications</span> Low-stock alert sent for insulin and paracetamol',
        '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">medical_services</span> Doctor attendance status updated for evening shift'
    ]
};

const medicineData = {
    stats: [
        { value: '1,240', label: 'Units in stock' },
        { value: '3', label: 'Items below threshold' },
        { value: '2', label: 'Expiring this week' }
    ],
    inventory: [
        { name: 'Paracetamol', stock: '120', status: 'Low' },
        { name: 'ORS Packets', stock: '80', status: 'Normal' },
        { name: 'Insulin', stock: '15', status: 'Critical' },
        { name: 'Amoxicillin', stock: '45', status: 'Normal' }
    ],
    alerts: [
        '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> Reorder insulin within 24 hours',
        '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> 2 vaccine vials expire soon',
        '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> ORS stock is stable'
    ]
};

const patientData = {
    today: [
        { value: '142', label: 'Patients today' },
        { value: '18 min', label: 'Average wait time' },
        { value: '12', label: 'Pending consultations' }
    ],
    week: [
        { value: '780', label: 'Patients this week' },
        { value: '16 min', label: 'Average wait time' },
        { value: '34', label: 'Pending consultations' }
    ],
    month: [
        { value: '3,240', label: 'Patients this month' },
        { value: '14 min', label: 'Average wait time' },
        { value: '48', label: 'Pending consultations' }
    ],
    bars: {
        today: [
            { label: 'Morning', value: 85 },
            { label: 'Afternoon', value: 70 },
            { label: 'Evening', value: 55 }
        ],
        week: [
            { label: 'Morning', value: 78 },
            { label: 'Afternoon', value: 65 },
            { label: 'Evening', value: 60 }
        ],
        month: [
            { label: 'Morning', value: 82 },
            { label: 'Afternoon', value: 68 },
            { label: 'Evening', value: 58 }
        ]
    },
    highlights: {
        today: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">priority_high</span> Registration queue is longest at 10:00 AM', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Pharmacy counter is operating smoothly', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> 4 patients are waiting for specialist review'],
        week: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">priority_high</span> Monday morning peak exceeded average by 12%', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Pharmacy throughput improved this week', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> 18 patients remain pending for specialist review'],
        month: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">priority_high</span> Seasonal flu rush increased evening load', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Resource planning improved monthly throughput', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> 31 patients are awaiting follow-up consultation']
    }
};

const bedData = {
    all: [
        { value: '16', label: 'Open beds' },
        { value: '4', label: 'Occupied ICU beds' },
        { value: '2', label: 'Need urgent cleaning' }
    ],
    icu: [
        { value: '2', label: 'ICU beds open' },
        { value: '4', label: 'ICU beds occupied' },
        { value: '1', label: 'ICU bed needs prep' }
    ],
    general: [
        { value: '10', label: 'General beds open' },
        { value: '8', label: 'General beds occupied' },
        { value: '1', label: 'General bed needs cleaning' }
    ],
    pediatrics: [
        { value: '4', label: 'Pediatric beds open' },
        { value: '2', label: 'Pediatric beds occupied' },
        { value: '0', label: 'Pediatric beds need cleaning' }
    ],
    wards: {
        all: [
            { ward: 'General Ward', status: '8/12 free' },
            { ward: 'ICU', status: '2/6 free' },
            { ward: 'Pediatrics', status: '6/8 free' }
        ],
        icu: [
            { ward: 'ICU', status: '2/6 free' },
            { ward: 'Critical Care', status: '1/3 free' }
        ],
        general: [
            { ward: 'General Ward', status: '8/12 free' },
            { ward: 'Maternity', status: '3/5 free' }
        ],
        pediatrics: [
            { ward: 'Pediatrics', status: '6/8 free' },
            { ward: 'Neonatal', status: '2/4 free' }
        ]
    },
    actions: {
        all: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">single_bed</span> Prepare maternity bed for incoming transfer', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">cleaning_services</span> Clean 2 discharge beds before noon', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Emergency room waiting area has capacity'],
        icu: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">single_bed</span> Prepare ICU bed for emergency transfer', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">cleaning_services</span> Prepare one critical care bay', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Oxygen supply is stable'],
        general: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">single_bed</span> Shift one patient to a general ward', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">cleaning_services</span> Clean one discharge bed', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> General admissions are flowing normally'],
        pediatrics: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">single_bed</span> Prepare pediatric bed for incoming admission', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">cleaning_services</span> Sanitize one pediatric room', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Pediatric ward has enough capacity']
    }
};

const doctorData = {
    today: [
        { value: '92%', label: 'Attendance rate' },
        { value: '3', label: 'Doctors on duty' },
        { value: '1', label: 'Shift pending approval' }
    ],
    week: [
        { value: '90%', label: 'Attendance rate' },
        { value: '14', label: 'Doctors covered' },
        { value: '2', label: 'Shift issues' }
    ],
    month: [
        { value: '94%', label: 'Attendance rate' },
        { value: '28', label: 'Doctors covered' },
        { value: '3', label: 'Leave requests' }
    ],
    roster: [
        { doctor: 'Dr. Shah', shift: 'Morning', status: 'Present' },
        { doctor: 'Dr. Mehta', shift: 'Afternoon', status: 'Late' },
        { doctor: 'Dr. Kumar', shift: 'Evening', status: 'Present' }
    ],
    notes: {
        today: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Morning clinic is fully covered', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> One doctor needs replacement for evening duty', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Attendance reports are synced to admin'],
        week: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Attendance improved after reminder alerts', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> Two late arrivals reported on Wednesday', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Weekly roster is stable'],
        month: ['<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Monthly attendance target achieved', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">warning</span> Two leave requests pending approval', '<span class="material-icons" style="font-size: inherit; vertical-align: middle;">check_circle</span> Coverage remained consistent through the month']
    }
};

const contactData = [
    { title: 'Reach us', body: ['Email: info@smarthealth.in', 'Phone: +91 98765 43210', 'Location: PHC/CHC digital operations support'] },
    { title: 'Need a deployment?', body: ['We can help with frontend screens, dashboards, admin panels, and AI-based workflow modules.'] }
];

function renderCards(containerId, items, linkField = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => `
        <article class="card">
            <h3>${item.title}</h3>
            <p>${item.desc || ''}</p>
            ${linkField ? `<a href="${item.link}">View module →</a>` : ''}
        </article>
    `).join('');
}

function renderStats(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => `
        <div class="stat-card">
            <h3>${item.value}</h3>
            <p>${item.label}</p>
        </div>
    `).join('');
}

function renderTable(containerId, rows, columns) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <table>
            <thead><tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(row => `<tr>${columns.map(col => `<td>${row[col.toLowerCase()] || row[col] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
    `;
}

function renderList(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => `<div class="alert-item">${item}</div>`).join('');
}

function renderBars(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items.map(item => `
        <div>
            <span>${item.label}</span>
            <div class="bar"><div style="width:${item.value}%"></div></div>
        </div>
    `).join('');
}

function renderContact() {
    const container = document.getElementById('contact-grid');
    if (!container) return;
    container.innerHTML = contactData.map(item => `
        <article class="card">
            <h3>${item.title}</h3>
            ${item.body.map(text => `<p>${text}</p>`).join('')}
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.style.display === 'flex';
            nav.style.display = open ? 'none' : 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '56px';
            nav.style.right = '1rem';
            nav.style.background = 'white';
            nav.style.padding = '1rem';
            nav.style.border = '1px solid var(--border)';
            nav.style.borderRadius = '12px';
            nav.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
        });
    }

    const page = document.body.dataset.page;

    if (page === 'login' || page === 'register') {
        const form = document.querySelector('.auth-form');
        const message = document.getElementById('auth-message');
        if (form && message) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                const email = formData.get('email');
                const role = formData.get('role') || 'Patient';
                const name = formData.get('name') || 'User';
                const action = page === 'login' ? 'logged in' : 'registered';
                message.textContent = `${name} successfully ${action} as ${role}.`;
                localStorage.setItem('smartHealthUser', JSON.stringify({ name, email, role }));
            });
        }
    }

    if (page === 'login' || page === 'register') {
        const stored = localStorage.getItem('smartHealthUser');
        const message = document.getElementById('auth-message');
        if (stored && message) {
            const user = JSON.parse(stored);
            message.textContent = `Welcome back, ${user.name} (${user.role}).`;
        }
    }

    if (page === 'home') {
        renderCards('module-grid', homeData.modules, true);
        renderCards('role-grid', homeData.roles);
        renderCards('feature-grid', homeData.features);
        renderList('feed-list', homeData.feed);

        const banner = document.getElementById('welcome-banner');
        const user = JSON.parse(localStorage.getItem('smartHealthUser') || 'null');
        if (banner) {
            banner.textContent = user ? `Welcome back, ${user.name}. Your alerts are ready.` : 'Live monitoring active: 3 priority alerts need attention.';
        }

        const searchInput = document.getElementById('quick-search');
        const resultsBox = document.getElementById('search-results');
        const performSearch = () => {
            const query = (searchInput?.value || '').trim().toLowerCase();
            if (!query) {
                resultsBox.innerHTML = '';
                return;
            }
            const filtered = homeData.searchItems.filter(item => `${item.type} ${item.name}`.toLowerCase().includes(query));
            resultsBox.innerHTML = filtered.map(item => `<div class="mini-result"><strong>${item.name}</strong> — ${item.type}</div>`).join('');
        };
        if (searchInput && resultsBox) {
            searchInput.addEventListener('input', performSearch);
            performSearch();
        }
    }

    if (page === 'medicine') {
        renderStats('stats-grid', medicineData.stats);
        renderTable('inventory-table', medicineData.inventory, ['Medicine', 'Stock', 'Status']);
        renderList('alert-list', medicineData.alerts);
    }

    if (page === 'patient') {
        const select = document.getElementById('period-select');
        const renderPatient = () => {
            const key = select ? select.value : 'today';
            renderStats('stats-grid', patientData[key]);
            renderBars('flow-bars', patientData.bars[key]);
            renderList('flow-highlights', patientData.highlights[key]);
        };
        if (select) {
            select.addEventListener('change', renderPatient);
        }
        renderPatient();
    }

    if (page === 'bed') {
        const select = document.getElementById('bed-filter');
        const renderBeds = () => {
            const key = select ? select.value : 'all';
            renderStats('stats-grid', bedData[key]);
            renderList('ward-list', bedData.wards[key].map(item => `<span>${item.ward}</span><strong>${item.status}</strong>`));
            renderList('bed-actions', bedData.actions[key]);
        };
        if (select) {
            select.addEventListener('change', renderBeds);
        }
        renderBeds();
    }

    if (page === 'doctor') {
        const select = document.getElementById('doctor-range');
        const renderDoctor = () => {
            const key = select ? select.value : 'today';
            renderStats('stats-grid', doctorData[key]);
            renderTable('doctor-table', doctorData.roster, ['Doctor', 'Shift', 'Status']);
            renderList('doctor-notes', doctorData.notes[key]);
        };
        if (select) {
            select.addEventListener('change', renderDoctor);
        }
        renderDoctor();
    }

    if (page === 'contact') {
        renderContact();
    }
});
