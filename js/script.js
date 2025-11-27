// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentUserRole = null;
let todoData = {};
let currentDivisi = null;
let jadwalAdmin = [];
let absensiData = {};

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

// ===== UTILITY FUNCTIONS =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== FIREBASE HELPERS =====
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initLoginTabs();
    initLoginForms();
    initLogout();
    initTabs();
    initTodoForm();
    initModals();
    initSidebarLinks();
    initHamburgerMenu();
    
    loadAllDataFromFirebase();
});

// ===== FIREBASE: LOAD ALL DATA =====
async function loadAllDataFromFirebase() {
    showLoading();
    try {
        await loadTodosFromFirebase();
        await loadJadwalFromFirebase();
        await loadAbsensiFromFirebase();
        console.log('✅ All data loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading data:', error);
    } finally {
        hideLoading();
    }
}

// ===== FIREBASE: TODOS =====
async function loadTodosFromFirebase() {
    try {
        const snapshot = await todoCollection.get();
        
        Object.keys(divisiInfo).forEach(divisi => {
            todoData[divisi] = [];
        });
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const divisi = data.divisi;
            if (todoData[divisi]) {
                todoData[divisi].push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        console.log('✅ Todos loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading todos:', error);
    }
}

async function saveTodoToFirebase(divisi, todo) {
    showLoading();
    try {
        const docData = {
            divisi,
            nama: todo.nama,
            prioritas: todo.prioritas,
            tanggal: todo.tanggal,
            waktu: todo.waktu,
            deskripsi: todo.deskripsi,
            completed: todo.completed || false,
            createdBy: todo.createdBy,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await todoCollection.add(docData);
        todo.id = docRef.id;
        console.log('✅ Todo saved to Firebase:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving todo:', error);
        alert('❌ Gagal menyimpan data. Cek koneksi internet Anda.');
    } finally {
        hideLoading();
    }
}

async function updateTodoInFirebase(todoId, updates) {
    showLoading();
    try {
        await todoCollection.doc(todoId).update(updates);
        console.log('✅ Todo updated in Firebase:', todoId);
    } catch (error) {
        console.error('❌ Error updating todo:', error);
        alert('❌ Gagal update data.');
    } finally {
        hideLoading();
    }
}

async function deleteTodoFromFirebase(todoId) {
    showLoading();
    try {
        await todoCollection.doc(todoId).delete();
        console.log('✅ Todo deleted from Firebase:', todoId);
    } catch (error) {
        console.error('❌ Error deleting todo:', error);
        alert('❌ Gagal hapus data.');
    } finally {
        hideLoading();
    }
}

// ===== FIREBASE: JADWAL =====
async function loadJadwalFromFirebase() {
    try {
        const snapshot = await jadwalCollection.orderBy('tanggal', 'asc').get();
        jadwalAdmin = [];
        snapshot.forEach(doc => {
            jadwalAdmin.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Jadwal loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading jadwal:', error);
    }
}

// ===== FIREBASE: ABSENSI (lama, untuk menu Absensi anggota) =====
async function loadAbsensiFromFirebase() {
    try {
        const snapshot = await absensiCollection.orderBy('tanggal', 'desc').limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            absensiData = { id: doc.id, ...doc.data() };
        } else {
            absensiData = {
                tanggal: '2025-11-24',
                acara: 'Belum ada data absensi',
                hadir: [],
                izin: [],
                alpha: []
            };
        }
        console.log('✅ Absensi (ringkasan) loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading absensi:', error);
    }
}

// ===== LOGIN TAB NAVIGATION =====
function initLoginTabs() {
    const tabButtons = document.querySelectorAll('.login-tab-btn');
    const loginForms = document.querySelectorAll('.login-form');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const loginType = this.dataset.login;
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loginForms.forEach(form => form.classList.remove('active'));
            
            if (loginType === 'anggota') {
                document.getElementById('loginFormAnggota').classList.add('active');
            } else if (loginType === 'admin') {
                document.getElementById('loginFormAdmin').classList.add('active');
            } else {
                document.getElementById('loginFormDeveloper').classList.add('active');
            }
            document.getElementById('errorMessage').style.display = 'none';
        });
    });
}

// ===== LOGIN HANDLERS =====
function initLoginForms() {
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
    document.getElementById('userName').textContent = userData.nama;
    document.getElementById('userNim').textContent = `NIM: ${currentUser}`;
    
    renderDivisiMenu(userData.divisi);
    currentDivisi = userData.divisi[0];
    
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex';
    
    document.getElementById('nimAnggota').value = '';
    document.getElementById('nimAdmin').value = '';
    document.getElementById('passwordAdmin').value = '';
    document.getElementById('passwordDeveloper').value = '';
    
    switchDivisi(currentDivisi);
    initAdminMode();
}

function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    setTimeout(() => { errorMsg.style.display = 'none'; }, 3000);
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
    document.querySelectorAll('.divisi-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-divisi="${divisi}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    const info = divisiInfo[divisi];
    document.getElementById('divisiTitle').textContent = `${info.emoji} ${info.nama}`;
    document.querySelector('[data-tab="input"]').click();
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
    document.getElementById('todoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const todo = {
            nama: document.getElementById('namaKegiatan').value,
            prioritas: document.querySelector('input[name="prioritas"]:checked').value,
            tanggal: document.getElementById('tanggal').value,
            waktu: document.getElementById('waktu').value,
            deskripsi: document.getElementById('deskripsi').value,
            completed: false,
            createdBy: currentUser
        };
        
        const todoId = await saveTodoToFirebase(currentDivisi, todo);
        if (todoId) {
            todo.id = todoId;
            todoData[currentDivisi].push(todo);
            this.reset();
            alert('✅ To-Do berhasil ditambahkan!');
            setTimeout(() => { document.querySelector('[data-tab="hasil"]').click(); }, 500);
        }
    });
}

// ===== DISPLAY RESULTS =====
function displayResults() {
    const todos = todoData[currentDivisi] || [];
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
    if (!todos.length) return '<div class="empty-state"><p>Tidak ada item</p></div>';
    return todos.map(todo => `
        <div class="todo-item ${priority}">
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.nama)}</div>
                <div class="todo-deadline">📅 ${formatDate(todo.tanggal)}</div>
                <div class="todo-time">⏰ ${todo.waktu} WITA</div>
                ${todo.deskripsi ? `<div style="margin-top:8px;font-size:13px;color:#555;">📝 ${escapeHtml(todo.deskripsi)}</div>` : ''}
            </div>
            <div class="todo-actions">
                ${!todo.completed ? `
                    <button class="btn-check" onclick="toggleComplete('${todo.id}','${currentDivisi}',true)">✓ Selesai</button>
                    <button class="btn-edit" onclick="editTodo('${todo.id}','${currentDivisi}')">✏️ Edit</button>
                ` : `
                    <button class="btn-uncheck" onclick="toggleComplete('${todo.id}','${currentDivisi}',false)">↻ Batal</button>
                `}
                <button class="btn-delete" onclick="deleteTodo('${todo.id}','${currentDivisi}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

// ===== TODO ACTIONS =====
async function toggleComplete(id, divisi, status) {
    const todo = (todoData[divisi] || []).find(t => t.id === id);
    if (!todo) return;
    todo.completed = status;
    await updateTodoInFirebase(id, { completed: status });
    displayResults();
}

async function deleteTodo(id, divisi) {
    if (!confirm('Yakin ingin menghapus?')) return;
    await deleteTodoFromFirebase(id);
    todoData[divisi] = (todoData[divisi] || []).filter(t => t.id !== id);
    displayResults();
}

function editTodo(id, divisi) {
    const todo = (todoData[divisi] || []).find(t => t.id === id);
    if (!todo) return;
    document.getElementById('namaKegiatan').value = todo.nama;
    document.querySelector(`input[name="prioritas"][value="${todo.prioritas}"]`).checked = true;
    document.getElementById('tanggal').value = todo.tanggal;
    document.getElementById('waktu').value = todo.waktu;
    document.getElementById('deskripsi').value = todo.deskripsi;
    deleteTodoFromFirebase(id);
    todoData[divisi] = todoData[divisi].filter(t => t.id !== id);
    document.querySelector('[data-tab="input"]').click();
    document.getElementById('namaKegiatan').focus();
}

// ===== LOGOUT =====
function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (!confirm('Yakin ingin logout?')) return;
        currentUser = null;
        currentUserRole = null;
        currentDivisi = null;
        document.getElementById('mainContainer').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('todoForm').reset();
        document.querySelectorAll('.login-tab-btn')[0].click();
    });
}

// ===== SIDEBAR LINKS =====
function initSidebarLinks() {
    document.getElementById('downloadFile').addEventListener('click', e => {
        e.preventDefault();
        alert('🚧 Fitur download file akan segera hadir!');
    });
    document.getElementById('contactPerson').addEventListener('click', e => {
        e.preventDefault();
        openModal('cpModal');
    });
    document.getElementById('jadwalAdmin').addEventListener('click', e => {
        e.preventDefault();
        renderJadwal();
        openModal('jadwalModal');
    });
    document.getElementById('absensiLink').addEventListener('click', e => {
        e.preventDefault();
        renderAbsensi();
        openModal('absensiModal');
    });
}

// ===== MODALS =====
function initModals() {
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    });
    document.querySelectorAll('.cp-item').forEach(item => {
        item.addEventListener('click', function() {
            const phone = this.dataset.phone;
            window.location.href = `tel:${phone}`;
        });
    });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'block';
}

// ===== RENDER JADWAL =====
function renderJadwal() {
    const jadwalList = document.getElementById('jadwalList');
    if (!jadwalAdmin.length) {
        jadwalList.innerHTML = '<div class="empty-state"><p>Belum ada jadwal</p></div>';
        return;
    }
    jadwalList.innerHTML = jadwalAdmin.map(j => `
        <div class="jadwal-item">
            <div class="jadwal-title">${escapeHtml(j.judul)}</div>
            <div class="jadwal-date">📅 ${formatDate(j.tanggal)} | ⏰ ${j.waktu} WITA</div>
            <div class="jadwal-date">📍 ${escapeHtml(j.tempat)}</div>
            ${j.deskripsi ? `<div style="margin-top:8px;font-size:13px;color:#555;">${escapeHtml(j.deskripsi)}</div>` : ''}
        </div>
    `).join('');
}

// ===== RENDER ABSENSI (ringkas) =====
function renderAbsensi() {
    const absensiContent = document.getElementById('absensiContent');
    const hadirCount = absensiData.hadir?.length || 0;
    const izinCount = absensiData.izin?.length || 0;
    const alphaCount = absensiData.alpha?.length || 0;
    absensiContent.innerHTML = `
        <h3 style="margin-bottom:15px;">Acara: ${escapeHtml(absensiData.acara)}</h3>
        <p style="margin-bottom:20px;color:#7f8c8d;">Tanggal: ${formatDate(absensiData.tanggal)}</p>
        <h4 style="margin-top:20px;margin-bottom:10px;color:#27ae60;">✅ Hadir (${hadirCount})</h4>
        <table class="absensi-table">
            <thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Waktu</th></tr></thead>
            <tbody>
                ${(absensiData.hadir || []).map((m,i)=>`
                    <tr><td>${i+1}</td><td>${m.nim}</td><td>${escapeHtml(m.nama)}</td><td>${m.waktu} WITA</td></tr>
                `).join('')}
            </tbody>
        </table>
        <h4 style="margin-top:20px;margin-bottom:10px;color:#f39c12;">📝 Izin (${izinCount})</h4>
        <table class="absensi-table">
            <thead><tr><th>No</th><th>NIM</th><th>Nama</th><th>Keterangan</th></tr></thead>
            <tbody>
                ${(absensiData.izin || []).map((m,i)=>`
                    <tr><td>${i+1}</td><td>${m.nim}</td><td>${escapeHtml(m.nama)}</td><td>${escapeHtml(m.keterangan)}</td></tr>
                `).join('')}
            </tbody>
        </table>
        <h4 style="margin-top:20px;margin-bottom:10px;color:#e74c3c;">❌ Alpha (${alphaCount})</h4>
        <table class="absensi-table">
            <thead><tr><th>No</th><th>NIM</th><th>Nama</th></tr></thead>
            <tbody>
                ${(absensiData.alpha || []).map((m,i)=>`
                    <tr><td>${i+1}</td><td>${m.nim}</td><td>${escapeHtml(m.nama)}</td></tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== HAMBURGER MENU =====
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeSidebar = () => {
        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    const toggleSidebar = () => {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    };
    if (hamburger) hamburger.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });
}

// ===== ADMIN MODE =====
function initAdminMode() {
    if (currentUserRole === 'admin' || currentUserRole === 'developer') {
        showAdminFeatures();
    }
}

function showAdminFeatures() {
    if (document.getElementById('adminPanel')) return;
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const li = document.createElement('li');
    li.innerHTML = '<a href="#" id="adminPanel">⚙️ Panel Admin</a>';
    sidebarMenu.appendChild(li);
    document.getElementById('adminPanel').addEventListener('click', e => {
        e.preventDefault();
        openAdminPanel();
    });
}

// ===== ADMIN ABSENSI SESSION MANAGEMENT =====
async function initAbsensiSessionHandlers() {
    const createForm = document.getElementById('createAbsensiSessionForm');
    if (createForm && !createForm.dataset.bound) {
        createForm.addEventListener('submit', handleCreateAbsensiSession);
        createForm.dataset.bound = 'true';
    }
    await loadAbsensiSessions();
}

async function handleCreateAbsensiSession(e) {
    e.preventDefault();
    const acara = document.getElementById('sessionAcara').value.trim();
    const tanggal = document.getElementById('sessionTanggal').value;
    const startTime = document.getElementById('sessionStartTime').value;
    const endTime = document.getElementById('sessionEndTime').value;
    if (!acara || !tanggal || !startTime || !endTime) {
        alert('Mohon isi semua field terlebih dahulu.');
        return;
    }
    const sessionData = {
        acara,
        tanggal,
        startTime,
        endTime,
        createdBy: currentUser || 'unknown',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
    };
    showLoading();
    try {
        const docRef = await absensiSessionsCollection.add(sessionData);
        console.log('✅ Absensi session created with ID:', docRef.id);
        const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
        const absensiLink = `${baseUrl}absensi.html?id=${docRef.id}`;
        showAbsensiLinkModal(absensiLink, sessionData.acara);
        e.target.reset();
        await loadAbsensiSessions();
    } catch (err) {
        console.error('❌ Error creating absensi session:', err);
        alert('Gagal membuat sesi absensi.');
    } finally {
        hideLoading();
    }
}

async function loadAbsensiSessions() {
    const activeContainer = document.getElementById('activeSessionsList');
    const pastContainer = document.getElementById('pastSessionsList');
    if (!activeContainer || !pastContainer) return;
    showLoading();
    try {
        const snapshot = await absensiSessionsCollection
            .orderBy('tanggal', 'desc')
            .orderBy('createdAt', 'desc')
            .get();
        const today = new Date().toISOString().split('T')[0];
        const active = [], past = [];
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            const status = data.status || 'active';
            if (status === 'active' && data.tanggal >= today) active.push(data);
            else past.push(data);
        });
        renderActiveSessions(active);
        renderPastSessions(past);
        console.log('✅ Absensi sessions loaded:', { active: active.length, past: past.length });
    } catch (err) {
        console.error('❌ Error loading absensi sessions:', err);
        activeContainer.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:20px;">Gagal memuat sesi absensi.</p>';
    } finally {
        hideLoading();
    }
}

function renderActiveSessions(sessions) {
    const container = document.getElementById('activeSessionsList');
    if (!container) return;
    if (!sessions.length) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Belum ada sesi aktif</p>';
        return;
    }
    const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
    container.innerHTML = sessions.map(s => {
        const link = `${baseUrl}absensi.html?id=${s.id}`;
        return `
        <div class="session-item active">
            <div class="session-header">
                <div>
                    <div class="session-title">${escapeHtml(s.acara)}</div>
                    <div class="session-meta">
                        📅 ${formatDate(s.tanggal)} | ⏰ ${s.startTime} - ${s.endTime} WITA
                    </div>
                </div>
                <span class="session-badge active">🟢 Aktif</span>
            </div>
            <div class="session-actions">
                <button onclick="viewAbsensiLink('${link}','${escapeHtml(s.acara)}')" class="btn-action primary">🔗 Lihat Link</button>
                <button onclick="viewAbsensiResults('${s.id}')" class="btn-action secondary">📊 Lihat Hasil</button>
                <button onclick="closeAbsensiSession('${s.id}')" class="btn-action danger">🔒 Tutup Absensi</button>
            </div>
        </div>`;
    }).join('');
}

function renderPastSessions(sessions) {
    const container = document.getElementById('pastSessionsList');
    if (!container) return;
    if (!sessions.length) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Belum ada riwayat</p>';
        return;
    }
    container.innerHTML = sessions.map(s => `
        <div class="session-item">
            <div class="session-header">
                <div>
                    <div class="session-title">${escapeHtml(s.acara)}</div>
                    <div class="session-meta">
                        📅 ${formatDate(s.tanggal)} | ⏰ ${s.startTime} - ${s.endTime} WITA
                    </div>
                </div>
                <span class="session-badge closed">🔴 Ditutup</span>
            </div>
            <div class="session-actions">
                <button onclick="viewAbsensiResults('${s.id}')" class="btn-action secondary">📊 Lihat Hasil Akhir</button>
                <button onclick="deleteAbsensiSession('${s.id}')" class="btn-action danger">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

function viewAbsensiLink(link, acara) { showAbsensiLinkModal(link, acara); }

// ===== REALTIME RESULT MODAL (tanpa countdown) =====
async function viewAbsensiResults(sessionId) {
    showLoading();
    try {
        const sessionDoc = await absensiSessionsCollection.doc(sessionId).get();
        if (!sessionDoc.exists) {
            alert('Sesi tidak ditemukan.');
            return;
        }
        const session = { id: sessionDoc.id, ...sessionDoc.data() };
        const snap = await db.collection('absensi_kehadiran')
            .where('sessionId','==',sessionId)
            .orderBy('timestamp','asc')
            .get();
        const hadir = [];
        snap.forEach(d => hadir.push(d.data()));
        const hadirNIMs = hadir.map(h => h.nim);
        const tidakHadir = [];
        Object.keys(MEMBERS_DATA.members).forEach(nim => {
            if (!hadirNIMs.includes(nim)) {
                tidakHadir.push({ nim, nama: MEMBERS_DATA.members[nim].nama });
            }
        });
        showAbsensiResultsModal(session, hadir, tidakHadir);
    } catch (err) {
        console.error('Error loading results:', err);
        alert('Gagal memuat data absensi.');
    } finally {
        hideLoading();
    }
}

// ===== LINK ABSENSI MODAL =====
function showAbsensiLinkModal(link, acara) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:600px;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2 style="margin-bottom:20px;">🔗 Link Absensi Berhasil Dibuat!</h2>
            
            <div style="background:#f0f8ff;padding:20px;border-radius:8px;margin-bottom:20px;">
                <p style="margin-bottom:10px;font-weight:600;">Acara: ${escapeHtml(acara)}</p>
                <p style="font-size:13px;color:#666;margin-bottom:15px;">
                    Bagikan link ini kepada seluruh panitia:
                </p>
                <input id="linkToCopy" type="text" value="${link}" readonly
                       style="width:100%;padding:12px;border:2px solid #667eea;border-radius:5px;font-size:14px;margin-bottom:15px;">
                <button onclick="copyAbsensiLink()"
                        style="width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:5px;font-weight:600;cursor:pointer;">
                    📋 Copy Link
                </button>
            </div>
            
            <div style="background:#fff9e6;padding:15px;border-radius:8px;border-left:4px solid #f39c12;">
                <p style="font-size:13px;color:#666;margin-bottom:10px;"><strong>⚠️ Catatan:</strong></p>
                <ul style="font-size:13px;color:#666;padding-left:20px;">
                    <li>Link hanya aktif pada rentang waktu yang ditentukan.</li>
                    <li>Akses dibatasi radius sekitar UIN Antasari untuk absensi produksi.</li>
                </ul>
            </div>
            
            <button onclick="this.closest('.modal').remove()"
                    style="width:100%;margin-top:20px;padding:12px;background:#95a5a6;color:white;border:none;border-radius:5px;font-weight:600;cursor:pointer;">
                Tutup
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyAbsensiLink() {
    const input = document.getElementById('linkToCopy');
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    alert('✅ Link absensi berhasil di‑copy!');
}

function showAbsensiResultsModal(session, hadir, tidakHadir) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.id = 'resultsModal';
    const totalMembers = Object.keys(MEMBERS_DATA.members).length;
    modal.innerHTML = `
        <div class="modal-content" style="max-width:900px;">
            <span class="close" onclick="stopRealtimeMonitoring();this.closest('.modal').remove()">&times;</span>
            <h2>📊 Hasil Absensi</h2>
            <div class="session-info-box">
                <h3>${escapeHtml(session.acara)}</h3>
                <p>📅 ${formatDate(session.tanggal)} | ⏰ ${session.startTime} - ${session.endTime} WITA</p>
                <div class="auto-refresh-badge">🔄 Auto refresh setiap 5 detik</div>
            </div>
            <div class="stats-counter-grid">
                <div class="counter-card hadir">
                    <div class="counter-value" id="liveHadirCount">${hadir.length}</div>
                    <div class="counter-label">✅ Hadir</div>
                    <div class="counter-percent">${((hadir.length/totalMembers)*100).toFixed(1)}%</div>
                </div>
                <div class="counter-card tidak-hadir">
                    <div class="counter-value" id="liveTidakHadirCount">${tidakHadir.length}</div>
                    <div class="counter-label">❌ Tidak Hadir</div>
                    <div class="counter-percent">${((tidakHadir.length/totalMembers)*100).toFixed(1)}%</div>
                </div>
            </div>
            <div class="refresh-info-box">
                <div class="refresh-info-content">
                    <span class="refresh-label">Last Update:</span>
                    <span class="refresh-time" id="lastUpdateTime">Baru saja</span>
                </div>
                <button onclick="manualRefreshResults()" class="btn-refresh-manual">🔄 Refresh</button>
            </div>
            <div class="absensi-tables-container">
                <div class="absensi-table-section">
                    <div class="table-header">
                        <h4>✅ Daftar Hadir (<span id="hadirCountText">${hadir.length}</span>)</h4>
                        <button onclick="exportHadirCSV('${escapeHtml(session.acara)}')" class="btn-export">📥 Export CSV</button>
                    </div>
                    <div class="table-wrapper">
                        <table class="absensi-table">
                            <thead><tr><th style="width:50px;">No</th><th>Nama</th><th class="hide-mobile" style="width:130px;">NIM</th><th style="width:100px;">Waktu</th></tr></thead>
                            <tbody id="hadirTableBody">
                                ${hadir.map((h,i)=>`
                                    <tr>
                                        <td>${i+1}</td>
                                        <td><strong>${escapeHtml(h.nama)}</strong>
                                            <span class="show-mobile" style="display:none;font-size:11px;color:#999;margin-top:3px;">${h.nim}</span>
                                        </td>
                                        <td class="hide-mobile"><small>${h.nim}</small></td>
                                        <td><small>${h.waktu}</small></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="absensi-table-section">
                    <div class="table-header">
                        <h4>❌ Tidak Hadir (<span id="tidakHadirCountText">${tidakHadir.length}</span>)</h4>
                    </div>
                    <div class="table-wrapper">
                        <table class="absensi-table">
                            <thead><tr><th style="width:50px;">No</th><th>Nama</th><th style="width:110px;">Aksi</th></tr></thead>
                            <tbody id="tidakHadirTableBody">
                                ${tidakHadir.map((t,i)=>`
                                    <tr id="row-${t.nim}">
                                        <td>${i+1}</td>
                                        <td><strong>${escapeHtml(t.nama)}</strong>
                                            <div style="font-size:11px;color:#999;margin-top:3px;">${t.nim}</div>
                                        </td>
                                        <td><button onclick="quickAddIzin('${escapeHtml(session.acara)}','${t.nim}','${escapeHtml(t.nama)}')" class="btn-izin">➕ Izin</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <button onclick="stopRealtimeMonitoring();this.closest('.modal').remove()" class="btn-close-modal">✕ Tutup</button>
        </div>`;
    document.body.appendChild(modal);
    startRealtimeMonitoring(session.id);
}

// realtime simple (auto refresh 5 detik)
let realtimeInterval = null;
let currentSessionId = null;

function startRealtimeMonitoring(sessionId) {
    currentSessionId = sessionId;
    realtimeInterval = setInterval(() => refreshAbsensiData(sessionId), 5000);
}

function stopRealtimeMonitoring() {
    if (realtimeInterval) clearInterval(realtimeInterval);
    realtimeInterval = null;
    currentSessionId = null;
}

async function refreshAbsensiData(sessionId) {
    try {
        const snap = await db.collection('absensi_kehadiran')
            .where('sessionId','==',sessionId)
            .orderBy('timestamp','asc')
            .get();
        const hadir = [];
        snap.forEach(d => hadir.push(d.data()));
        const hadirNIMs = hadir.map(h=>h.nim);
        const tidakHadir = [];
        Object.keys(MEMBERS_DATA.members).forEach(nim=>{
            if (!hadirNIMs.includes(nim)) tidakHadir.push({nim, nama: MEMBERS_DATA.members[nim].nama});
        });
        updateRealtimeUI(hadir, tidakHadir);
        const now = new Date();
        const el = document.getElementById('lastUpdateTime');
        if (el) el.textContent = now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    } catch(e){
        console.error('Error refresh absensi:', e);
    }
}

function updateRealtimeUI(hadir, tidakHadir) {
    const total = Object.keys(MEMBERS_DATA.members).length;
    const hCount = document.getElementById('liveHadirCount');
    const thCount = document.getElementById('liveTidakHadirCount');
    if (hCount) {
        hCount.textContent = hadir.length;
        const p = hCount.closest('.counter-card').querySelector('.counter-percent');
        if (p) p.textContent = `${((hadir.length/total)*100).toFixed(1)}%`;
    }
    if (thCount) {
        thCount.textContent = tidakHadir.length;
        const p = thCount.closest('.counter-card').querySelector('.counter-percent');
        if (p) p.textContent = `${((tidakHadir.length/total)*100).toFixed(1)}%`;
    }
    const hBody = document.getElementById('hadirTableBody');
    if (hBody) {
        hBody.innerHTML = hadir.map((h,i)=>`
            <tr>
                <td>${i+1}</td>
                <td><strong>${escapeHtml(h.nama)}</strong>
                    <span class="show-mobile" style="display:none;font-size:11px;color:#999;margin-top:3px;">${h.nim}</span>
                </td>
                <td class="hide-mobile"><small>${h.nim}</small></td>
                <td><small>${h.waktu}</small></td>
            </tr>`).join('');
    }
    const thBody = document.getElementById('tidakHadirTableBody');
    if (thBody) {
        thBody.innerHTML = tidakHadir.map((t,i)=>`
            <tr id="row-${t.nim}">
                <td>${i+1}</td>
                <td><strong>${escapeHtml(t.nama)}</strong>
                    <div style="font-size:11px;color:#999;margin-top:3px;">${t.nim}</div>
                </td>
                <td><button onclick="quickAddIzin('${currentSessionId}','${t.nim}','${escapeHtml(t.nama)}')" class="btn-izin">➕ Izin</button></td>
            </tr>`).join('');
    }
    const hText = document.getElementById('hadirCountText');
    const thText = document.getElementById('tidakHadirCountText');
    if (hText) hText.textContent = hadir.length;
    if (thText) thText.textContent = tidakHadir.length;
}

function manualRefreshResults() {
    if (currentSessionId) refreshAbsensiData(currentSessionId);
}

function quickAddIzin(acara, nim, nama) {
    const ket = prompt(`Keterangan izin untuk ${nama}:`, 'Sakit');
    if (!ket) return;
    showLoading();
    const data = {
        acara,
        tanggal: new Date().toISOString().split('T')[0],
        izin: [{nim, nama, keterangan: ket}],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    absensiCollection.add(data).then(()=>{
        hideLoading();
        alert(`✅ ${nama} ditandai izin: ${ket}`);
        const row = document.getElementById(`row-${nim}`);
        if (row) row.remove();
    }).catch(err=>{
        hideLoading();
        console.error('Error simpan izin:', err);
        alert('Gagal menyimpan izin.');
    });
}

function exportHadirCSV(acara) {
    const body = document.getElementById('hadirTableBody');
    if (!body) return;
    let csv = 'No,Nama,NIM,Waktu Absen\n';
    body.querySelectorAll('tr').forEach(row=>{
        const tds = row.querySelectorAll('td');
        if (tds.length < 3) return;
        const no = tds[0].textContent.trim();
        const nama = tds[1].querySelector('strong')?.textContent.trim() || '';
        const nim = (tds[2].querySelector('small') || tds[1].querySelector('.show-mobile'))?.textContent.trim() || '';
        const waktu = tds[tds.length-1].querySelector('small')?.textContent.trim() || '';
        csv += `${no},"${nama}",${nim},${waktu}\n`;
    });
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Absensi_${acara.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== CLOSE / DELETE SESSION =====
async function closeAbsensiSession(sessionId) {
    if (!confirm('Tutup sesi absensi ini?')) return;
    showLoading();
    try {
        await absensiSessionsCollection.doc(sessionId).update({
            status: 'closed',
            closedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Sesi absensi ditutup!');
        await loadAbsensiSessions();
    } catch (e) {
        console.error('Error closing session:', e);
        alert('Gagal menutup sesi.');
    } finally {
        hideLoading();
    }
}

async function deleteAbsensiSession(sessionId) {
    if (!confirm('Hapus sesi absensi ini beserta datanya?')) return;
    showLoading();
    try {
        await absensiSessionsCollection.doc(sessionId).delete();
        const snap = await db.collection('absensi_kehadiran').where('sessionId','==',sessionId).get();
        const batch = db.batch();
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
        alert('✅ Sesi absensi dihapus!');
        await loadAbsensiSessions();
    } catch (e) {
        console.error('Error delete session:', e);
        alert('Gagal menghapus sesi.');
    } finally {
        hideLoading();
    }
}

// ===== ADMIN PANEL (DASHBOARD, TODO, JADWAL, ABSENSI) =====
function openAdminPanel() {
    const modal = document.createElement('div');
    modal.id = 'adminPanelModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:1000px;">
            <span class="close" onclick="closeAdminPanel()">&times;</span>
            <h2>⚙️ Panel Admin</h2>
            <div class="admin-tabs">
                <button class="admin-tab-btn active" data-tab="dashboard">📊 Dashboard</button>
                <button class="admin-tab-btn" data-tab="allTodos">📋 Semua To-Do</button>
                <button class="admin-tab-btn" data-tab="manageJadwal">📅 Kelola Jadwal</button>
                <button class="admin-tab-btn" data-tab="manageAbsensi">📋 Kelola Absensi</button>
            </div>
            <div id="adminDashboard" class="admin-section active">
                <h3>Dashboard Statistik</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📋</div>
                        <div class="stat-value" id="totalTodos">0</div>
                        <div class="stat-label">Total To-Do</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⚠️</div>
                        <div class="stat-value" id="urgentTodos">0</div>
                        <div class="stat-label">Penting & Mendesak</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value" id="completedTodos">0</div>
                        <div class="stat-label">Selesai</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value">${Object.keys(MEMBERS_DATA.members).length}</div>
                        <div class="stat-label">Total Anggota</div>
                    </div>
                </div>
                <h4 style="margin-top:30px;">Statistik Per Divisi</h4>
                <div id="divisiStats"></div>
            </div>
            <div id="adminAllTodos" class="admin-section">
                <h3>Semua To-Do List</h3>
                <div class="filter-section">
                    <select id="filterDivisi" class="filter-select">
                        <option value="all">Semua Divisi</option>
                    </select>
                    <select id="filterStatus" class="filter-select">
                        <option value="all">Semua Status</option>
                        <option value="active">Belum Selesai</option>
                        <option value="completed">Selesai</option>
                    </select>
                    <button onclick="filterAdminTodos()" class="btn-filter">🔍 Filter</button>
                </div>
                <div id="adminTodosList"></div>
            </div>
            <div id="adminManageJadwal" class="admin-section">
                <h3>Kelola Jadwal Admin</h3>
                <form id="adminJadwalForm" class="admin-form">
                    <div class="form-row">
                        <div class="form-field">
                            <label>Judul Acara</label>
                            <input type="text" id="jadwalJudul" required>
                        </div>
                        <div class="form-field">
                            <label>Tanggal</label>
                            <input type="date" id="jadwalTanggal" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Waktu (WITA)</label>
                            <input type="time" id="jadwalWaktu" required>
                        </div>
                        <div class="form-field">
                            <label>Tempat</label>
                            <input type="text" id="jadwalTempat" required>
                        </div>
                    </div>
                    <div class="form-field">
                        <label>Deskripsi</label>
                        <textarea id="jadwalDeskripsi" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn-save">➕ Tambah Jadwal</button>
                </form>
                <hr style="margin:30px 0;">
                <h4>List Jadwal</h4>
                <div id="adminJadwalList"></div>
            </div>
            <div id="adminManageAbsensi" class="admin-section">
                <h3>Kelola Sesi Absensi Otomatis</h3>
                <div class="admin-form" style="background:#f0f8ff;border-left:4px solid #667eea;">
                    <h4 style="margin-bottom:20px;">➕ Buat Sesi Absensi Baru</h4>
                    <form id="createAbsensiSessionForm">
                        <div class="form-row">
                            <div class="form-field">
                                <label>Nama Acara/Kegiatan</label>
                                <input type="text" id="sessionAcara" required>
                            </div>
                            <div class="form-field">
                                <label>Tanggal</label>
                                <input type="date" id="sessionTanggal" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-field">
                                <label>Jam Mulai Absensi (WITA)</label>
                                <input type="time" id="sessionStartTime" value="09:30" required>
                            </div>
                            <div class="form-field">
                                <label>Jam Tutup Absensi (WITA)</label>
                                <input type="time" id="sessionEndTime" value="10:00" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-save">🔗 Buat Link Absensi</button>
                    </form>
                </div>
                <hr style="margin:30px 0;">
                <h4>📋 Sesi Absensi Aktif</h4>
                <div id="activeSessionsList"></div>
                <hr style="margin:30px 0;">
                <h4>📜 Riwayat Absensi</h4>
                <div id="pastSessionsList"></div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    initAdminTabs();
    loadAdminDashboard();
    populateFilterDivisi();
}

function closeAdminPanel() {
    const m = document.getElementById('adminPanelModal');
    if (m) m.remove();
}

function initAdminTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            document.querySelectorAll('.admin-tab-btn').forEach(b=>b.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(sec=>sec.classList.remove('active'));
            const target = document.getElementById(`admin${capitalize(tab)}`);
            if (target) target.classList.add('active');
            if (tab === 'dashboard') loadAdminDashboard();
            else if (tab === 'allTodos') loadAdminAllTodos();
            else if (tab === 'manageJadwal') loadAdminJadwalList();
            else if (tab === 'manageAbsensi') initAbsensiSessionHandlers();
        });
    });
    const form = document.getElementById('adminJadwalForm');
    if (form && !form.dataset.bound) {
        form.addEventListener('submit', handleAdminJadwalSubmit);
        form.dataset.bound = 'true';
    }
}

async function loadAdminDashboard() {
    let total=0, urgent=0, completed=0;
    const divStats = {};
    Object.keys(divisiInfo).forEach(d=>{
        const todos = todoData[d] || [];
        total += todos.length;
        urgent += todos.filter(t=>t.prioritas==='urgent' && !t.completed).length;
        completed += todos.filter(t=>t.completed).length;
        divStats[d] = {
            total: todos.length,
            completed: todos.filter(t=>t.completed).length,
            urgent: todos.filter(t=>t.prioritas==='urgent' && !t.completed).length
        };
    });
    document.getElementById('totalTodos').textContent = total;
    document.getElementById('urgentTodos').textContent = urgent;
    document.getElementById('completedTodos').textContent = completed;
    const container = document.getElementById('divisiStats');
    container.innerHTML = Object.keys(divisiInfo).map(d=>{
        const info = divisiInfo[d];
        const s = divStats[d];
        const prog = s.total ? Math.round((s.completed/s.total)*100) : 0;
        return `
            <div class="divisi-stat-item">
                <div class="divisi-stat-header">
                    <span class="divisi-stat-name">${info.emoji} ${info.nama}</span>
                    <span class="divisi-stat-progress">${prog}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div>
                <div class="divisi-stat-details">
                    Total: ${s.total} | Selesai: ${s.completed} | Penting: ${s.urgent}
                </div>
            </div>`;
    }).join('');
}

function populateFilterDivisi() {
    const sel = document.getElementById('filterDivisi');
    if (!sel || sel.dataset.filled) return;
    Object.keys(divisiInfo).forEach(d=>{
        const o = document.createElement('option');
        o.value = d;
        o.textContent = `${divisiInfo[d].emoji} ${divisiInfo[d].nama}`;
        sel.appendChild(o);
    });
    sel.dataset.filled = 'true';
}

function filterAdminTodos() { loadAdminAllTodos(); }

function loadAdminAllTodos() {
    const fDiv = document.getElementById('filterDivisi').value;
    const fStat = document.getElementById('filterStatus').value;
    let all = [];
    if (fDiv === 'all') {
        Object.keys(divisiInfo).forEach(d=>{
            (todoData[d]||[]).forEach(t=>all.push({...t, divisi:d}));
        });
    } else {
        (todoData[fDiv]||[]).forEach(t=>all.push({...t, divisi:fDiv}));
    }
    if (fStat === 'active') all = all.filter(t=>!t.completed);
    else if (fStat === 'completed') all = all.filter(t=>t.completed);
    all.sort((a,b)=> new Date(a.tanggal) - new Date(b.tanggal));
    const list = document.getElementById('adminTodosList');
    if (!all.length) {
        list.innerHTML = '<div class="empty-state"><p>Tidak ada to-do</p></div>';
        return;
    }
    list.innerHTML = all.map(t=>`
        <div class="admin-todo-item ${t.completed?'completed':''}">
            <div class="admin-todo-badge ${t.prioritas}">${getPriorityLabel(t.prioritas)}</div>
            <div class="admin-todo-divisi">${divisiInfo[t.divisi].emoji} ${divisiInfo[t.divisi].nama}</div>
            <div class="admin-todo-title">${escapeHtml(t.nama)}</div>
            <div class="admin-todo-meta">
                📅 ${formatDate(t.tanggal)} | ⏰ ${t.waktu} WITA
                ${t.deskripsi?`<br>📝 ${escapeHtml(t.deskripsi)}`:''}
            </div>
            <div class="admin-todo-actions">
                ${!t.completed?`
                    <button class="btn-check" onclick="adminToggleTodo('${t.id}','${t.divisi}',true)">✓ Tandai Selesai</button>
                `:`
                    <button class="btn-uncheck" onclick="adminToggleTodo('${t.id}','${t.divisi}',false)">↻ Batal Selesai</button>
                `}
                <button class="btn-delete" onclick="adminDeleteTodo('${t.id}','${t.divisi}')">🗑️ Hapus</button>
            </div>
        </div>`).join('');
}

// ===== JADWAL ADMIN (tambah / hapus) =====
async function handleAdminJadwalSubmit(e) {
    e.preventDefault();
    const jadwal = {
        judul: document.getElementById('jadwalJudul').value,
        tanggal: document.getElementById('jadwalTanggal').value,
        waktu: document.getElementById('jadwalWaktu').value,
        tempat: document.getElementById('jadwalTempat').value,
        deskripsi: document.getElementById('jadwalDeskripsi').value
    };
    showLoading();
    try {
        await jadwalCollection.add({...jadwal, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
        await loadJadwalFromFirebase();
        loadAdminJadwalList();
        e.target.reset();
        alert('✅ Jadwal berhasil ditambahkan!');
    } catch(e){
        console.error('Error adding jadwal:', e);
        alert('❌ Gagal menambahkan jadwal.');
    } finally { hideLoading(); }
}

async function loadAdminJadwalList() {
    const list = document.getElementById('adminJadwalList');
    if (!jadwalAdmin.length) {
        list.innerHTML = '<p style="text-align:center;color:#999;">Belum ada jadwal</p>';
        return;
    }
    list.innerHTML = jadwalAdmin.map(j=>`
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(j.judul)}</div>
                <div class="list-item-info">📅 ${formatDate(j.tanggal)} | ⏰ ${j.waktu} | 📍 ${escapeHtml(j.tempat)}</div>
                ${j.deskripsi?`<div class="list-item-info">${escapeHtml(j.deskripsi)}</div>`:''}
            </div>
            <button class="btn-delete-item" onclick="deleteAdminJadwal('${j.id}')">🗑️ Hapus</button>
        </div>`).join('');
}

async function deleteAdminJadwal(id) {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    showLoading();
    try {
        await jadwalCollection.doc(id).delete();
        await loadJadwalFromFirebase();
        loadAdminJadwalList();
        alert('✅ Jadwal berhasil dihapus!');
    } catch(e){
        console.error('Error deleting jadwal:', e);
        alert('❌ Gagal menghapus jadwal.');
    } finally { hideLoading(); }
}

// ===== SERVICE WORKER PWA =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('✅ Service Worker registered:', reg))
            .catch(err => console.log('❌ Service Worker registration failed:', err));
    });
}

// default tab
document.getElementById('inputTab').style.display = 'block';
