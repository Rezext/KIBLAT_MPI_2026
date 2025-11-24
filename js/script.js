// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentUserRole = null; // 'anggota', 'admin', atau 'developer'
let todoData = {};
let currentDivisi = null;

// Divisi list dengan emoji dan nama lengkap
const divisiInfo = {
    'acara': { emoji: '📅', nama: 'Acara' },
    'humas': { emoji: '💰', nama: 'Humas (Sponsorship)' },
    'promosi': { emoji: '📢', nama: 'Promosi' },
    'kestapen': { emoji: '🔐', nama: 'Kestapen' },
    'pdd': { emoji: '🎯', nama: 'PDD' },
    'keamanan': { emoji: '🛡️', nama: 'Keamanan' },
    'konsumsi': { emoji: '🍽️', nama: 'Konsumsi' },
    'perleng': { emoji: '📦', nama: 'Perlengkapan' }
};

// Initialize todoData untuk semua divisi
Object.keys(divisiInfo).forEach(divisi => {
    todoData[divisi] = [];
});

// Jadwal dari Admin (contoh data)
let jadwalAdmin = [
    {
        id: 1,
        judul: 'Rapat Koordinasi Semua Divisi',
        tanggal: '2025-12-01',
        waktu: '14:00',
        tempat: 'Ruang Sidang Gedung A',
        deskripsi: 'Rapat pembahasan timeline kegiatan KIBLAT MPI 2026'
    },
    {
        id: 2,
        judul: 'Deadline Proposal Sponsorship',
        tanggal: '2025-12-05',
        waktu: '23:59',
        tempat: 'Online',
        deskripsi: 'Pengumpulan proposal ke divisi Humas'
    }
];

// Data Absensi (contoh)
let absensiData = {
    tanggal: '2025-11-24',
    acara: 'Rapat Koordinasi Perdana',
    hadir: [
        { nim: '230101050652', nama: 'AHMAD RIJANI', waktu: '14:05' },
        { nim: '230101050763', nama: 'AIDA MUSLIMAH', waktu: '14:03' },
        { nim: '230101050654', nama: 'ALYA MUFIDA', waktu: '14:10' }
    ],
    izin: [
        { nim: '230101050276', nama: 'WARDATUSHOFIA', keterangan: 'Sakit' }
    ],
    alpha: [
        { nim: '230101050650', nama: 'AHMAD MAULANA' }
    ]
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initLoginTabs();
    initLoginForms();
    initLogout();
    initTabs();
    initTodoForm();
    initModals();
    initSidebarLinks();
});

// ===== LOGIN TAB NAVIGATION =====
function initLoginTabs() {
    const tabButtons = document.querySelectorAll('.login-tab-btn');
    const loginForms = document.querySelectorAll('.login-form');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const loginType = this.dataset.login;
            
            // Remove active from all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all forms
            loginForms.forEach(form => form.classList.remove('active'));
            
            // Show selected form
            if (loginType === 'anggota') {
                document.getElementById('loginFormAnggota').classList.add('active');
            } else if (loginType === 'admin') {
                document.getElementById('loginFormAdmin').classList.add('active');
            } else if (loginType === 'developer') {
                document.getElementById('loginFormDeveloper').classList.add('active');
            }
            
            // Clear error message
            document.getElementById('errorMessage').style.display = 'none';
        });
    });
}

// ===== LOGIN HANDLERS =====
function initLoginForms() {
    // Login Anggota
    document.getElementById('loginFormAnggota').addEventListener('submit', function(e) {
        e.preventDefault();
        const nim = document.getElementById('nimAnggota').value.trim();
        
        if (MEMBERS_DATA.members[nim]) {
            currentUser = nim;
            currentUserRole = 'anggota';
            loginSuccess();
        } else {
            showError('❌ NIM tidak ditemukan. Silakan hubungi admin.');
        }
    });
    
    // Login Admin
    document.getElementById('loginFormAdmin').addEventListener('submit', function(e) {
        e.preventDefault();
        const nim = document.getElementById('nimAdmin').value.trim();
        const password = document.getElementById('passwordAdmin').value;
        
        if (MEMBERS_DATA.adminNIMs.includes(nim) && password === MEMBERS_DATA.adminPassword) {
            currentUser = nim;
            currentUserRole = 'admin';
            loginSuccess();
        } else {
            showError('❌ NIM atau password admin salah.');
        }
    });
    
    // Login Developer
    document.getElementById('loginFormDeveloper').addEventListener('submit', function(e) {
        e.preventDefault();
        const password = document.getElementById('passwordDeveloper').value;
        
        if (password === MEMBERS_DATA.developerPassword) {
            currentUser = MEMBERS_DATA.developerNIM;
            currentUserRole = 'developer';
            loginSuccess();
        } else {
            showError('❌ Password developer salah.');
        }
    });
}

function loginSuccess() {
    const userData = MEMBERS_DATA.members[currentUser];
    
    // Update sidebar header
    document.getElementById('userName').textContent = userData.nama;
    document.getElementById('userNim').textContent = `NIM: ${currentUser}`;
    
    // Render divisi menu
    renderDivisiMenu(userData.divisi);
    
    // Set divisi pertama sebagai active
    currentDivisi = userData.divisi[0];
    
    // Hide login, show dashboard
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex';
    
    // Clear login forms
    document.getElementById('nimAnggota').value = '';
    document.getElementById('nimAdmin').value = '';
    document.getElementById('passwordAdmin').value = '';
    document.getElementById('passwordDeveloper').value = '';
    
    // Load first divisi
    switchDivisi(currentDivisi);
}

function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 3000);
}

// ===== RENDER DIVISI MENU =====
function renderDivisiMenu(divisiList) {
    const divisiContainer = document.getElementById('divisiList');
    divisiContainer.innerHTML = '';
    
    divisiList.forEach((divisi, index) => {
        const info = divisiInfo[divisi];
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'divisi-link' + (index === 0 ? ' active' : '');
        link.dataset.divisi = divisi;
        link.textContent = `${info.emoji} ${info.nama}`;
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            switchDivisi(divisi);
        });
        
        divisiContainer.appendChild(link);
    });
}

// ===== DIVISI NAVIGATION =====
function switchDivisi(divisi) {
    currentDivisi = divisi;
    
    // Update active menu
    document.querySelectorAll('.divisi-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-divisi="${divisi}"]`).classList.add('active');
    
    // Update title
    const info = divisiInfo[divisi];
    document.getElementById('divisiTitle').textContent = `${info.emoji} ${info.nama}`;
    
    // Reset to input tab
    document.querySelector('[data-tab="input"]').click();
    
    // Refresh display
    displayResults();
}

// ===== TAB NAVIGATION =====
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (tab === 'input') {
                document.getElementById('inputTab').style.display = 'block';
                document.getElementById('hasilTab').classList.remove('active');
            } else {
                document.getElementById('inputTab').style.display = 'none';
                document.getElementById('hasilTab').classList.add('active');
                displayResults();
            }
        });
    });
}

// ===== TODO FORM =====
function initTodoForm() {
    document.getElementById('todoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const todo = {
            id: Date.now(),
            nama: document.getElementById('namaKegiatan').value,
            prioritas: document.querySelector('input[name="prioritas"]:checked').value,
            tanggal: document.getElementById('tanggal').value,
            waktu: document.getElementById('waktu').value,
            deskripsi: document.getElementById('deskripsi').value,
            completed: false,
            createdBy: currentUser,
            createdAt: new Date().toISOString()
        };
        
        todoData[currentDivisi].push(todo);
        
        this.reset();
        alert('✅ To-Do berhasil ditambahkan!');
        
        // Auto switch to hasil tab
        setTimeout(() => {
            document.querySelector('[data-tab="hasil"]').click();
        }, 500);
    });
}

// ===== DISPLAY RESULTS =====
function displayResults() {
    const todos = todoData[currentDivisi];
    
    const urgent = todos.filter(t => t.prioritas === 'urgent' && !t.completed);
    const medium = todos.filter(t => t.prioritas === 'medium' && !t.completed);
    const low = todos.filter(t => t.prioritas === 'low' && !t.completed);
    const completed = todos.filter(t => t.completed);
    
    document.getElementById('urgentList').innerHTML = renderTodos(urgent, 'urgent');
    document.getElementById('mediumList').innerHTML = renderTodos(medium, 'medium');
    document.getElementById('lowList').innerHTML = renderTodos(low, 'low');
    document.getElementById('completedList').innerHTML = renderTodos(completed, 'completed');
}

function renderTodos(todos, priority) {
    if (todos.length === 0) {
        return '<div class="empty-state"><p>Tidak ada item</p></div>';
    }
    
    return todos.map(todo => `
        <div class="todo-item ${priority}">
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.nama)}</div>
                <div class="todo-deadline">📅 ${formatDate(todo.tanggal)}</div>
                <div class="todo-time">⏰ ${todo.waktu} WITA</div>
                ${todo.deskripsi ? `<div style="margin-top: 8px; font-size: 13px; color: #555;">📝 ${escapeHtml(todo.deskripsi)}</div>` : ''}
            </div>
            <div class="todo-actions">
                ${!todo.completed ? `
                    <button class="btn-check" onclick="toggleComplete(${todo.id}, '${currentDivisi}', true)">✓ Selesai</button>
                    <button class="btn-edit" onclick="editTodo(${todo.id}, '${currentDivisi}')">✏️ Edit</button>
                ` : `
                    <button class="btn-uncheck" onclick="toggleComplete(${todo.id}, '${currentDivisi}', false)">↻ Batal</button>
                `}
                <button class="btn-delete" onclick="deleteTodo(${todo.id}, '${currentDivisi}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

// ===== TODO ACTIONS =====
function toggleComplete(id, divisi, status) {
    const todo = todoData[divisi].find(t => t.id === id);
    if (todo) {
        todo.completed = status;
        displayResults();
    }
}

function deleteTodo(id, divisi) {
    if (confirm('Yakin ingin menghapus?')) {
        todoData[divisi] = todoData[divisi].filter(todo => todo.id !== id);
        displayResults();
    }
}

function editTodo(id, divisi) {
    const todo = todoData[divisi].find(t => t.id === id);
    if (!todo) return;
    
    document.getElementById('namaKegiatan').value = todo.nama;
    document.querySelector(`input[name="prioritas"][value="${todo.prioritas}"]`).checked = true;
    document.getElementById('tanggal').value = todo.tanggal;
    document.getElementById('waktu').value = todo.waktu;
    document.getElementById('deskripsi').value = todo.deskripsi;
    
    todoData[divisi] = todoData[divisi].filter(t => t.id !== id);
    
    document.querySelector('[data-tab="input"]').click();
    document.getElementById('namaKegiatan').focus();
}

// ===== LOGOUT =====
function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Yakin ingin logout?')) {
            currentUser = null;
            currentUserRole = null;
            currentDivisi = null;
            document.getElementById('mainContainer').style.display = 'none';
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('todoForm').reset();
            
            // Reset ke tab login anggota
            document.querySelectorAll('.login-tab-btn')[0].click();
        }
    });
}

// ===== SIDEBAR LINKS =====
function initSidebarLinks() {
    // Download File
    document.getElementById('downloadFile').addEventListener('click', function(e) {
        e.preventDefault();
        alert('🚧 Fitur download file akan segera hadir!');
    });
    
    // Contact Person
    document.getElementById('contactPerson').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('cpModal');
    });
    
    // Jadwal Admin
    document.getElementById('jadwalAdmin').addEventListener('click', function(e) {
        e.preventDefault();
        renderJadwal();
        openModal('jadwalModal');
    });
    
    // Absensi
    document.getElementById('absensiLink').addEventListener('click', function(e) {
        e.preventDefault();
        renderAbsensi();
        openModal('absensiModal');
    });
}

// ===== MODALS =====
function initModals() {
    // Close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Click outside to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // CP items - click to call
    document.querySelectorAll('.cp-item').forEach(item => {
        item.addEventListener('click', function() {
            const phone = this.dataset.phone;
            window.location.href = `tel:${phone}`;
        });
    });
    
    // Download Absensi
    document.getElementById('downloadAbsensi').addEventListener('click', function() {
        alert('📥 Fitur download PDF absensi akan segera hadir!');
    });
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// ===== RENDER JADWAL =====
function renderJadwal() {
    const jadwalList = document.getElementById('jadwalList');
    
    if (jadwalAdmin.length === 0) {
        jadwalList.innerHTML = '<div class="empty-state"><p>Belum ada jadwal</p></div>';
        return;
    }
    
    jadwalList.innerHTML = jadwalAdmin.map(jadwal => `
        <div class="jadwal-item">
            <div class="jadwal-title">${escapeHtml(jadwal.judul)}</div>
            <div class="jadwal-date">📅 ${formatDate(jadwal.tanggal)} | ⏰ ${jadwal.waktu} WITA</div>
            <div class="jadwal-date">📍 ${escapeHtml(jadwal.tempat)}</div>
            ${jadwal.deskripsi ? `<div style="margin-top: 8px; font-size: 13px; color: #555;">${escapeHtml(jadwal.deskripsi)}</div>` : ''}
        </div>
    `).join('');
}

// ===== RENDER ABSENSI =====
function renderAbsensi() {
    const absensiContent = document.getElementById('absensiContent');
    
    absensiContent.innerHTML = `
        <h3 style="margin-bottom: 15px;">Acara: ${escapeHtml(absensiData.acara)}</h3>
        <p style="margin-bottom: 20px; color: #7f8c8d;">Tanggal: ${formatDate(absensiData.tanggal)}</p>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #27ae60;">✅ Hadir (${absensiData.hadir.length})</h4>
        <table class="absensi-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>NIM</th>
                    <th>Nama</th>
                    <th>Waktu</th>
                </tr>
            </thead>
            <tbody>
                ${absensiData.hadir.map((m, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${m.nim}</td>
                        <td>${escapeHtml(m.nama)}</td>
                        <td>${m.waktu} WITA</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #f39c12;">📝 Izin (${absensiData.izin.length})</h4>
        <table class="absensi-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>NIM</th>
                    <th>Nama</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                ${absensiData.izin.map((m, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${m.nim}</td>
                        <td>${escapeHtml(m.nama)}</td>
                        <td>${escapeHtml(m.keterangan)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #e74c3c;">❌ Alpha (${absensiData.alpha.length})</h4>
        <table class="absensi-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>NIM</th>
                    <th>Nama</th>
                </tr>
            </thead>
            <tbody>
                ${absensiData.alpha.map((m, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${m.nim}</td>
                        <td>${escapeHtml(m.nama)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.getElementById('inputTab').style.display = 'block';
