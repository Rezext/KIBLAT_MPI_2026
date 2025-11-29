// ===== GLOBAL VARIABLES =====
let currentUser = null;
let currentUserRole = null;
let todoData = {};
let currentDivisi = null;
let jadwalAdmin = [];
let absensiData = {};
let filesData = [];

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
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
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

async function loadAllDataFromFirebase() {
    showLoading();
    try {
        await loadTodosFromFirebase();
        await loadJadwalFromFirebase();
        await loadAbsensiFromFirebase();
        await loadFilesFromFirebase(); // TAMBAHAN BARU
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
            divisi: divisi,
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
        alert('❌ Gagal update data. Cek koneksi internet Anda.');
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
        alert('❌ Gagal hapus data. Cek koneksi internet Anda.');
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
            jadwalAdmin.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ Jadwal loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading jadwal:', error);
    }
}

// ===== FIREBASE: ABSENSI =====
async function loadAbsensiFromFirebase() {
    try {
        // Ambil sesi terakhir yang sudah ditutup
        const now = new Date();
        const today = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0');
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const snapshot = await db.collection('absensi_sessions')
            .orderBy('tanggal', 'desc')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        let latestPastSession = null;
        
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            const [endH, endM] = data.endTime.split(':').map(Number);
            const endTimeMinutes = endH * 60 + endM;
            
            // Cari sesi yang sudah lewat (riwayat)
            if (data.tanggal < today || (data.tanggal === today && currentTime > endTimeMinutes)) {
                if (!latestPastSession) {
                    latestPastSession = data;
                }
            }
        });
        
        if (latestPastSession) {
            // Load data kehadiran dari sesi terakhir
            const attendanceSnapshot = await db.collection('absensi_kehadiran')
                .where('sessionId', '==', latestPastSession.id)
                .orderBy('timestamp', 'asc')
                .get();
            
            const hadirList = [];
            attendanceSnapshot.forEach(doc => {
                hadirList.push(doc.data());
            });
            
            const hadirNIMs = hadirList.map(h => h.nim);
            const alphaList = [];
            
            Object.keys(MEMBERS_DATA.members).forEach(nim => {
                if (!hadirNIMs.includes(nim)) {
                    alphaList.push({
                        nim: nim,
                        nama: MEMBERS_DATA.members[nim].nama
                    });
                }
            });
            
            absensiData = {
                id: latestPastSession.id,
                acara: latestPastSession.acara,
                tanggal: latestPastSession.tanggal,
                hadir: hadirList,
                izin: [], // Bisa ditambahkan nanti
                alpha: alphaList
            };
        } else {
            absensiData = {
                tanggal: today,
                acara: 'Belum ada data absensi',
                hadir: [],
                izin: [],
                alpha: []
            };
        }
        
        console.log('✅ Absensi loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading absensi:', error);
    }
}

// ===== FIREBASE: FILES =====
async function loadFilesFromFirebase() {
    try {
        const snapshot = await db.collection('files')
            .orderBy('uploadedAt', 'desc')
            .get();
        
        filesData = [];
        snapshot.forEach(doc => {
            filesData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('✅ Files loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading files:', error);
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
            } else if (loginType === 'developer') {
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
    
    // PENTING: Init admin features di akhir
    initAdminMode();
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
    
    document.querySelectorAll('.divisi-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-divisi="${divisi}"]`).classList.add('active');
    
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
            
            setTimeout(() => {
                document.querySelector('[data-tab="hasil"]').click();
            }, 500);
        }
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
                    <button class="btn-check" onclick="toggleComplete('${todo.id}', '${currentDivisi}', true)">✓ Selesai</button>
                    <button class="btn-edit" onclick="editTodo('${todo.id}', '${currentDivisi}')">✏️ Edit</button>
                ` : `
                    <button class="btn-uncheck" onclick="toggleComplete('${todo.id}', '${currentDivisi}', false)">↻ Batal</button>
                `}
                <button class="btn-delete" onclick="deleteTodo('${todo.id}', '${currentDivisi}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

// ===== TODO ACTIONS =====
async function toggleComplete(id, divisi, status) {
    const todo = todoData[divisi].find(t => t.id === id);
    if (todo) {
        todo.completed = status;
        await updateTodoInFirebase(id, { completed: status });
        displayResults();
    }
}

async function deleteTodo(id, divisi) {
    if (confirm('Yakin ingin menghapus?')) {
        await deleteTodoFromFirebase(id);
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
    
    deleteTodoFromFirebase(id);
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
            
            document.querySelectorAll('.login-tab-btn')[0].click();
        }
    });
}

// ===== SIDEBAR LINKS =====
    function initSidebarLinks() {
    document.getElementById('downloadFile').addEventListener('click', function(e) {
    e.preventDefault();
    openFilesModal();
});
    
    document.getElementById('contactPerson').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('cpModal');
    });
    
    document.getElementById('jadwalAdmin').addEventListener('click', function(e) {
        e.preventDefault();
        renderJadwal();
        openModal('jadwalModal');
    });
    
    document.getElementById('absensiLink').addEventListener('click', function(e) {
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
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.cp-item').forEach(item => {
        item.addEventListener('click', function() {
            const phone = this.dataset.phone;
            window.location.href = `tel:${phone}`;
        });
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
    
    const hadirCount = absensiData.hadir?.length || 0;
    const izinCount = absensiData.izin?.length || 0;
    const alphaCount = absensiData.alpha?.length || 0;
    
    absensiContent.innerHTML = `
        <h3 style="margin-bottom: 15px;">Acara: ${escapeHtml(absensiData.acara)}</h3>
        <p style="margin-bottom: 20px; color: #7f8c8d;">Tanggal: ${formatDate(absensiData.tanggal)}</p>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #27ae60;">✅ Hadir (${hadirCount})</h4>
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
                ${(absensiData.hadir || []).map((m, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${m.nim}</td>
                        <td>${escapeHtml(m.nama)}</td>
                        <td>${m.waktu} WITA</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #f39c12;">📝 Izin (${izinCount})</h4>
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
                ${(absensiData.izin || []).map((m, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${m.nim}</td>
                        <td>${escapeHtml(m.nama)}</td>
                        <td>${escapeHtml(m.keterangan)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #e74c3c;">❌ Alpha (${alphaCount})</h4>
        <table class="absensi-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>NIM</th>
                    <th>Nama</th>
                </tr>
            </thead>
            <tbody>
                ${(absensiData.alpha || []).map((m, i) => `
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

// ===== HAMBURGER MENU TOGGLE =====
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const divisiLinks = document.querySelectorAll('.divisi-link');
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    function toggleSidebar() {
        hamburger.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        
        if (sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function closeSidebar() {
        hamburger.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    divisiLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(closeSidebar, 300);
            }
        });
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                setTimeout(closeSidebar, 300);
            }
        });
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

// ===== ADMIN MODE =====
function initAdminMode() {
    if (currentUserRole === 'admin' || currentUserRole === 'developer') {
        showAdminFeatures();
    }
}

function showAdminFeatures() {
    if (document.getElementById('adminPanel')) {
        return;
    }
    
    if (currentUserRole !== 'admin' && currentUserRole !== 'developer') {
        return; 
    }
    
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const adminMenu = document.createElement('li');
    adminMenu.innerHTML = '<a href="#" id="adminPanel">⚙️ Panel Admin</a>';
    sidebarMenu.appendChild(adminMenu);
    
    document.getElementById('adminPanel').addEventListener('click', function(e) {
        e.preventDefault();
        openAdminPanel();
    });
}


// ===== ADMIN ABSENSI SESSION MANAGEMENT =====
async function handleCreateAbsensiSession(e) {
    e.preventDefault();
    
    const sessionData = {
        acara: document.getElementById('sessionAcara').value,
        tanggal: document.getElementById('sessionTanggal').value,
        startTime: document.getElementById('sessionStartTime').value,
        endTime: document.getElementById('sessionEndTime').value,
        createdBy: currentUser,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active'
    };
    
    showLoading();
    try {
        const docRef = await db.collection('absensi_sessions').add(sessionData);
        
        const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
        const absensiLink = `${baseUrl}absensi.html?id=${docRef.id}`;
        
        showAbsensiLinkModal(absensiLink, sessionData.acara);
        
        e.target.reset();
        loadAbsensiSessions();
        
    } catch (error) {
        console.error('Error creating session:', error);
        alert('❌ Gagal membuat sesi absensi.');
    } finally {
        hideLoading();
    }
}

function showAbsensiLinkModal(link, acara) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2 style="margin-bottom: 20px;">🔗 Link Absensi Berhasil Dibuat!</h2>
            
            <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin-bottom: 10px; font-weight: 600;">Acara: ${acara}</p>
                <p style="font-size: 13px; color: #666; margin-bottom: 15px;">Bagikan link ini kepada seluruh panitia:</p>
                <input type="text" value="${link}" readonly style="width: 100%; padding: 12px; border: 2px solid #667eea; border-radius: 5px; font-size: 14px; margin-bottom: 15px;" id="linkToCopy">
                <button onclick="copyAbsensiLink()" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer;">
                    📋 Copy Link
                </button>
            </div>
            
            <div style="background: #fff9e6; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;"><strong>⚠️ Perhatian:</strong></p>
                <ul style="font-size: 13px; color: #666; padding-left: 20px;">
                    <li>Link hanya aktif pada waktu yang ditentukan</li>
                    <li>Akses hanya dalam radius 500m dari UIN Antasari</li>
                    <li>Setelah jam tutup, data otomatis diproses</li>
                </ul>
            </div>
            
            <button onclick="this.closest('.modal').remove()" style="width: 100%; margin-top: 20px; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer;">
                Tutup
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyAbsensiLink() {
    const input = document.getElementById('linkToCopy');
    input.select();
    document.execCommand('copy');
    alert('✅ Link berhasil di-copy!');
}

async function loadAbsensiSessions() {
    try {
        const snapshot = await db.collection('absensi_sessions')
            .orderBy('tanggal', 'desc')
            .orderBy('createdAt', 'desc')
            .get();
        
        const now = new Date();
        // FIX: Gunakan tanggal lokal (WITA), bukan UTC
        const today = now.getFullYear() + '-' + 
                      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(now.getDate()).padStart(2, '0');
        const currentTime = now.getHours() * 60 + now.getMinutes(); // waktu dalam menit
        
        const activeSessions = [];
        const pastSessions = [];
        
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            
            // Parsing waktu tutup (endTime) ke menit
            const [endH, endM] = data.endTime.split(':').map(Number);
            const endTimeMinutes = endH * 60 + endM;
            
            // DEBUG: Print ke console (bisa dihapus nanti)
            console.log('Sesi:', data.acara);
            console.log('Tanggal sesi:', data.tanggal, 'vs Today:', today);
            console.log('Waktu tutup:', endTimeMinutes, 'vs Current:', currentTime);
            
            // Cek: jika tanggal hari ini DAN waktu sekarang masih sebelum/sama dengan waktu tutup = AKTIF
            // ATAU jika tanggal di masa depan = AKTIF
            if (data.tanggal > today || (data.tanggal === today && currentTime <= endTimeMinutes)) {
                activeSessions.push(data);
            } else {
                pastSessions.push(data);
            }
        });
        
        renderActiveSessions(activeSessions);
        renderPastSessions(pastSessions);
        
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}



function renderActiveSessions(sessions) {
    const container = document.getElementById('activeSessionsList');
    
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Belum ada sesi aktif</p>';
        return;
    }
    
    container.innerHTML = sessions.map(session => {
        const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
        const link = `${baseUrl}absensi.html?id=${session.id}`;
        
        return `
            <div class="session-item active">
                <div class="session-header">
                    <div>
                        <div class="session-title">${escapeHtml(session.acara)}</div>
                        <div class="session-meta">
                            📅 ${formatDate(session.tanggal)} | 
                            ⏰ ${session.startTime} - ${session.endTime} WITA
                        </div>
                    </div>
                    <span class="session-badge active">🟢 Aktif</span>
                </div>
                <div class="session-actions">
                    <button onclick="viewAbsensiLink('${link}', '${escapeHtml(session.acara)}')" class="btn-action primary">
                        🔗 Lihat Link
                    </button>
                    <button onclick="viewAbsensiResults('${session.id}')" class="btn-action secondary">
                        📊 Lihat Hasil (Real-time)
                    </button>
                    <button onclick="closeAbsensiSession('${session.id}')" class="btn-action danger">
                        🔒 Tutup Absensi
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== DOWNLOAD EXCEL FUNCTIONS =====
function downloadAbsensiExcel(sessionId, sessionName, sessionDate) {
    showLoading();
    
    db.collection('absensi_sessions').doc(sessionId).get()
        .then(sessionDoc => {
            const sessionData = sessionDoc.data();
            
            return db.collection('absensi_kehadiran')
                .where('sessionId', '==', sessionId)
                .orderBy('timestamp', 'asc')
                .get()
                .then(attendanceSnapshot => {
                    const hadirList = [];
                    attendanceSnapshot.forEach(doc => {
                        hadirList.push(doc.data());
                    });
                    
                    const hadirNIMs = hadirList.map(h => h.nim);
                    const tidakHadirList = [];
                    
                    Object.keys(MEMBERS_DATA.members).forEach(nim => {
                        if (!hadirNIMs.includes(nim)) {
                            const member = MEMBERS_DATA.members[nim];
                            tidakHadirList.push({
                                nim: nim,
                                nama: member.nama,
                                divisi: member.divisi.join(', ')
                            });
                        }
                    });
                    
                    generateExcelFile(sessionName, sessionDate, sessionData, hadirList, tidakHadirList);
                });
        })
        .catch(error => {
            console.error('Error loading data:', error);
            alert('❌ Gagal mengunduh data absensi.');
        })
        .finally(() => {
            hideLoading();
        });
}

function generateExcelFile(sessionName, sessionDate, sessionData, hadirList, tidakHadirList) {
    // Header CSV
    let csvContent = '\uFEFF'; // UTF-8 BOM untuk Excel
    
    // Info Sesi
    csvContent += `Laporan Absensi\n`;
    csvContent += `Acara:,${sessionName}\n`;
    csvContent += `Tanggal:,${sessionDate}\n`;
    csvContent += `Waktu:,${sessionData.startTime} - ${sessionData.endTime} WITA\n`;
    csvContent += `\n`;
    
    // Ringkasan
    csvContent += `Ringkasan\n`;
    csvContent += `Total Panitia:,${Object.keys(MEMBERS_DATA.members).length}\n`;
    csvContent += `Hadir:,${hadirList.length}\n`;
    csvContent += `Tidak Hadir:,${tidakHadirList.length}\n`;
    csvContent += `Persentase Kehadiran:,${Math.round((hadirList.length / Object.keys(MEMBERS_DATA.members).length) * 100)}%\n`;
    csvContent += `\n`;
    
    // Daftar Hadir
    csvContent += `DAFTAR HADIR\n`;
    csvContent += `No,NIM,Nama,Divisi,Waktu Absen\n`;
    hadirList.forEach((h, i) => {
        const member = MEMBERS_DATA.members[h.nim];
        const divisi = member ? member.divisi.join(', ') : '-';
        csvContent += `${i + 1},${h.nim},"${h.nama}","${divisi}",${h.waktu} WITA\n`;
    });
    
    csvContent += `\n`;
    
    // Daftar Tidak Hadir
    csvContent += `DAFTAR TIDAK HADIR\n`;
    csvContent += `No,NIM,Nama,Divisi\n`;
    tidakHadirList.forEach((t, i) => {
        csvContent += `${i + 1},${t.nim},"${t.nama}","${t.divisi}"\n`;
    });
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `Absensi_${sessionName.replace(/\s+/g, '_')}_${sessionDate}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ File "${fileName}" berhasil diunduh!`);
}

function renderPastSessions(sessions) {
    const container = document.getElementById('pastSessionsList');
    
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Belum ada riwayat</p>';
        return;
    }
    
    container.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-header">
                <div>
                    <div class="session-title">${escapeHtml(session.acara)}</div>
                    <div class="session-meta">
                        📅 ${formatDate(session.tanggal)} | 
                        ⏰ ${session.startTime} - ${session.endTime} WITA
                    </div>
                </div>
                <span class="session-badge closed">🔴 Ditutup</span>
            </div>
            <div class="session-actions">
                <button onclick="viewAbsensiResults('${session.id}')" class="btn-action secondary">
                    📊 Lihat Hasil Akhir
                </button>
                <button onclick="downloadAbsensiExcel('${session.id}', '${escapeHtml(session.acara)}', '${session.tanggal}')" class="btn-action success">
                    📥 Download Excel
                </button>
                <button onclick="deleteAbsensiSession('${session.id}')" class="btn-action danger">
                    🗑️ Hapus
                </button>
            </div>
        </div>
    `).join('');
}


function viewAbsensiLink(link, acara) {
    showAbsensiLinkModal(link, acara);
}

async function viewAbsensiResults(sessionId) {
    showLoading();
    try {
        const sessionDoc = await db.collection('absensi_sessions').doc(sessionId).get();
        const sessionData = sessionDoc.data();
        
        const attendanceSnapshot = await db.collection('absensi_kehadiran')
            .where('sessionId', '==', sessionId)
            .orderBy('timestamp', 'asc')
            .get();
        
        const hadirList = [];
        const hadirNIMs = new Set(); // Gunakan Set untuk cek lebih cepat
        
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            hadirList.push(data);
            hadirNIMs.add(data.nim); // Tambahkan NIM ke Set
        });
        
        // PERBAIKAN: Filter tidak hadir berdasarkan NIM yang BELUM ada di hadirNIMs
        const tidakHadirList = [];
        Object.keys(MEMBERS_DATA.members).forEach(nim => {
            if (!hadirNIMs.has(nim)) { // Gunakan Set.has() lebih akurat
                tidakHadirList.push({
                    nim: nim,
                    nama: MEMBERS_DATA.members[nim].nama
                });
            }
        });
        
        console.log('Total Hadir:', hadirList.length);
        console.log('Total Tidak Hadir:', tidakHadirList.length);
        console.log('Total Semua:', hadirList.length + tidakHadirList.length);
        
        showAbsensiResultsModal(sessionData, hadirList, tidakHadirList);
        
    } catch (error) {
        console.error('Error loading results:', error);
        alert('❌ Gagal memuat data absensi.');
    } finally {
        hideLoading();
    }
}


function showAbsensiResultsModal(session, hadir, tidakHadir) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>📊 Hasil Absensi</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-bottom: 10px;">${escapeHtml(session.acara)}</h3>
                <p style="color: #666; font-size: 14px;">
                    📅 ${formatDate(session.tanggal)} | 
                    ⏰ ${session.startTime} - ${session.endTime} WITA
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
                <div style="background: #d5f4e6; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #27ae60;">${hadir.length}</div>
                    <div style="color: #27ae60; font-weight: 600;">✅ Hadir</div>
                </div>
                <div style="background: #fadbd8; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 700; color: #e74c3c;">${tidakHadir.length}</div>
                    <div style="color: #e74c3c; font-weight: 600;">❌ Tidak Hadir</div>
                </div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="color: #27ae60; margin-bottom: 10px;">✅ Daftar Hadir (${hadir.length})</h4>
                <table class="absensi-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama</th>
                            <th>Waktu Absen</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hadir.map((h, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${escapeHtml(h.nama)}</td>
                                <td>${h.waktu} WITA</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <h4 style="color: #e74c3c; margin-bottom: 10px;">❌ Tidak Hadir (${tidakHadir.length})</h4>
                <table class="absensi-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tidakHadir.map((t, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${escapeHtml(t.nama)}</td>
                                <td>
                                    <button onclick="addIzinManual('${escapeHtml(session.acara)}', '${t.nim}', '${escapeHtml(t.nama)}')" 
                                            style="padding: 5px 10px; background: #f39c12; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                                        ➕ Izin
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <button onclick="this.closest('.modal').remove()" style="width: 100%; margin-top: 20px; padding: 12px; background: #95a5a6; color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer;">
                Tutup
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function addIzinManual(acara, nim, nama) {
    const keterangan = prompt(`Masukkan keterangan izin untuk ${nama}:`, 'Sakit');
    
    if (keterangan) {
        const data = {
            acara: acara,
            tanggal: new Date().toISOString().split('T')[0],
            izin: [{
                nim: nim,
                nama: nama,
                keterangan: keterangan
            }],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        db.collection('absensi').add(data)
            .then(() => {
                alert(`✅ ${nama} berhasil ditandai izin!`);
                const modal = document.querySelector('.modal');
                if (modal) modal.remove();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('❌ Gagal menyimpan data izin.');
            });
    }
}

async function closeAbsensiSession(sessionId) {
    if (!confirm('Tutup sesi absensi ini? Data tidak hadir akan di-generate otomatis.')) {
        return;
    }
    
    showLoading();
    try {
        await db.collection('absensi_sessions').doc(sessionId).update({
            status: 'closed',
            closedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('✅ Sesi absensi ditutup!');
        loadAbsensiSessions();
        
    } catch (error) {
        console.error('Error closing session:', error);
        alert('❌ Gagal menutup sesi.');
    } finally {
        hideLoading();
    }
}

async function deleteAbsensiSession(sessionId) {
    if (!confirm('Hapus sesi absensi ini beserta semua datanya?')) {
        return;
    }
    
    showLoading();
    try {
        await db.collection('absensi_sessions').doc(sessionId).delete();
        
        const attendanceSnapshot = await db.collection('absensi_kehadiran')
            .where('sessionId', '==', sessionId)
            .get();
        
        const batch = db.batch();
        attendanceSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        alert('✅ Sesi absensi dihapus!');
        loadAbsensiSessions();
        
    } catch (error) {
        console.error('Error deleting session:', error);
        alert('❌ Gagal menghapus sesi.');
    } finally {
        hideLoading();
    }
}

function openAdminPanel() {
    const modal = document.createElement('div');
    modal.id = 'adminPanelModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px;">
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
                
                <h4 style="margin-top: 30px;">Statistik Per Divisi</h4>
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
                
                <hr style="margin: 30px 0;">
                <h4>List Jadwal</h4>
                <div id="adminJadwalList"></div>
            </div>

            <div id="adminManageAbsensi" class="admin-section">
                <h3>Kelola Sesi Absensi Otomatis</h3>
                
                <div class="admin-form" style="background: #f0f8ff; border-left: 4px solid #667eea;">
                    <h4 style="margin-bottom: 20px;">➕ Buat Sesi Absensi Baru</h4>
                    <form id="createAbsensiSessionForm">
                        <div class="form-row">
                            <div class="form-field">
                                <label>Nama Acara/Kegiatan</label>
                                <input type="text" id="sessionAcara" placeholder="Rapat Koordinasi" required>
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
                
                <hr style="margin: 30px 0;">
                
                <h4>📋 Sesi Absensi Aktif</h4>
                <div id="activeSessionsList"></div>
                
                <hr style="margin: 30px 0;">
                
                <h4>📜 Riwayat Absensi</h4>
                <div id="pastSessionsList"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    initAdminTabs();
    loadAdminDashboard();
    populateFilterDivisi();
}

function closeAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
        modal.remove();
    }
}

function initAdminTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.getElementById(`admin${capitalize(tab)}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            if (tab === 'dashboard') {
                loadAdminDashboard();
            } else if (tab === 'allTodos') {
                loadAdminAllTodos();
            } else if (tab === 'manageJadwal') {
                loadAdminJadwalList();
            } else if (tab === 'manageAbsensi') {
                loadAbsensiSessions();
            }
        });
    });
    
    const jadwalForm = document.getElementById('adminJadwalForm');
    if (jadwalForm) {
        jadwalForm.addEventListener('submit', handleAdminJadwalSubmit);
    }
    
    // PERBAIKAN BUG: Init event listener form absensi saat panel dibuka
    const createForm = document.getElementById('createAbsensiSessionForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateAbsensiSession);
    }
}

async function loadAdminDashboard() {
    let totalTodos = 0;
    let urgentTodos = 0;
    let completedTodos = 0;
    
    const divisiStatsData = {};
    
    Object.keys(divisiInfo).forEach(divisi => {
        const todos = todoData[divisi] || [];
        totalTodos += todos.length;
        urgentTodos += todos.filter(t => t.prioritas === 'urgent' && !t.completed).length;
        completedTodos += todos.filter(t => t.completed).length;
        
        divisiStatsData[divisi] = {
            total: todos.length,
            completed: todos.filter(t => t.completed).length,
            urgent: todos.filter(t => t.prioritas === 'urgent' && !t.completed).length
        };
    });
    
    document.getElementById('totalTodos').textContent = totalTodos;
    document.getElementById('urgentTodos').textContent = urgentTodos;
    document.getElementById('completedTodos').textContent = completedTodos;
    
    const divisiStatsEl = document.getElementById('divisiStats');
    divisiStatsEl.innerHTML = Object.keys(divisiInfo).map(divisi => {
        const info = divisiInfo[divisi];
        const stats = divisiStatsData[divisi];
        const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        
        return `
            <div class="divisi-stat-item">
                <div class="divisi-stat-header">
                    <span class="divisi-stat-name">${info.emoji} ${info.nama}</span>
                    <span class="divisi-stat-progress">${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="divisi-stat-details">
                    Total: ${stats.total} | Selesai: ${stats.completed} | Penting: ${stats.urgent}
                </div>
            </div>
        `;
    }).join('');
}

function populateFilterDivisi() {
    const select = document.getElementById('filterDivisi');
    if (select) {
        Object.keys(divisiInfo).forEach(divisi => {
            const option = document.createElement('option');
            option.value = divisi;
            option.textContent = `${divisiInfo[divisi].emoji} ${divisiInfo[divisi].nama}`;
            select.appendChild(option);
        });
    }
}

function filterAdminTodos() {
    loadAdminAllTodos();
}

function loadAdminAllTodos() {
    const filterDivisi = document.getElementById('filterDivisi').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    let allTodos = [];
    
    if (filterDivisi === 'all') {
        Object.keys(divisiInfo).forEach(divisi => {
            (todoData[divisi] || []).forEach(todo => {
                allTodos.push({ ...todo, divisi });
            });
        });
    } else {
        (todoData[filterDivisi] || []).forEach(todo => {
            allTodos.push({ ...todo, divisi: filterDivisi });
        });
    }
    
    if (filterStatus === 'active') {
        allTodos = allTodos.filter(t => !t.completed);
    } else if (filterStatus === 'completed') {
        allTodos = allTodos.filter(t => t.completed);
    }
    
    allTodos.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    
    const listEl = document.getElementById('adminTodosList');
    if (allTodos.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>Tidak ada to-do</p></div>';
        return;
    }
    
    listEl.innerHTML = allTodos.map(todo => `
        <div class="admin-todo-item ${todo.completed ? 'completed' : ''}">
            <div class="admin-todo-badge ${todo.prioritas}">${getPriorityLabel(todo.prioritas)}</div>
            <div class="admin-todo-divisi">${divisiInfo[todo.divisi].emoji} ${divisiInfo[todo.divisi].nama}</div>
            <div class="admin-todo-title">${escapeHtml(todo.nama)}</div>
            <div class="admin-todo-meta">
                📅 ${formatDate(todo.tanggal)} | ⏰ ${todo.waktu} WITA
                ${todo.deskripsi ? `<br>📝 ${escapeHtml(todo.deskripsi)}` : ''}
            </div>
            <div class="admin-todo-actions">
                ${!todo.completed ? `
                    <button class="btn-check" onclick="adminToggleTodo('${todo.id}', '${todo.divisi}', true)">✓ Tandai Selesai</button>
                ` : `
                    <button class="btn-uncheck" onclick="adminToggleTodo('${todo.id}', '${todo.divisi}', false)">↻ Batal Selesai</button>
                `}
                <button class="btn-delete" onclick="adminDeleteTodo('${todo.id}', '${todo.divisi}')">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

function getPriorityLabel(priority) {
    const labels = {
        'urgent': '⚠️ Penting',
        'medium': '📌 Sedang',
        'low': '✓ Tidak'
    };
    return labels[priority] || priority;
}

async function adminToggleTodo(id, divisi, status) {
    await toggleComplete(id, divisi, status);
    loadAdminAllTodos();
    loadAdminDashboard();
}

async function adminDeleteTodo(id, divisi) {
    if (confirm('Yakin ingin menghapus to-do ini?')) {
        await deleteTodoFromFirebase(id);
        todoData[divisi] = todoData[divisi].filter(todo => todo.id !== id);
        loadAdminAllTodos();
        loadAdminDashboard();
    }
}

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
        await jadwalCollection.add({
            ...jadwal,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await loadJadwalFromFirebase();
        loadAdminJadwalList();
        
        e.target.reset();
        alert('✅ Jadwal berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding jadwal:', error);
        alert('❌ Gagal menambahkan jadwal.');
    } finally {
        hideLoading();
    }
}

async function loadAdminJadwalList() {
    const listEl = document.getElementById('adminJadwalList');
    
    if (jadwalAdmin.length === 0) {
        listEl.innerHTML = '<p style="text-align: center; color: #999;">Belum ada jadwal</p>';
        return;
    }
    
    listEl.innerHTML = jadwalAdmin.map(jadwal => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(jadwal.judul)}</div>
                <div class="list-item-info">📅 ${formatDate(jadwal.tanggal)} | ⏰ ${jadwal.waktu} | 📍 ${escapeHtml(jadwal.tempat)}</div>
                ${jadwal.deskripsi ? `<div class="list-item-info">${escapeHtml(jadwal.deskripsi)}</div>` : ''}
            </div>
            <button class="btn-delete-item" onclick="deleteAdminJadwal('${jadwal.id}')">🗑️ Hapus</button>
        </div>
    `).join('');
}

async function deleteAdminJadwal(id) {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
        showLoading();
        try {
            await jadwalCollection.doc(id).delete();
            await loadJadwalFromFirebase();
            loadAdminJadwalList();
            alert('✅ Jadwal berhasil dihapus!');
        } catch (error) {
            console.error('Error deleting jadwal:', error);
            alert('❌ Gagal menghapus jadwal.');
        } finally {
            hideLoading();
        }
    }
}

// ===== PWA SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// ===== FILES MANAGEMENT =====
function openFilesModal() {
    const modal = document.getElementById('filesModal');
    modal.style.display = 'block';
    
    // Show form add file hanya untuk admin/developer
    const addFileForm = document.getElementById('addFileSection');
    if (currentUserRole === 'admin' || currentUserRole === 'developer') {
        addFileForm.style.display = 'block';
    } else {
        addFileForm.style.display = 'none';
    }
    
    renderFilesList();
}

function renderFilesList() {
    const filesList = document.getElementById('filesList');
    
    if (filesData.length === 0) {
        filesList.innerHTML = '<div class="empty-state"><p>Belum ada file tersedia</p></div>';
        return;
    }
    
    // Group by category
    const categories = {};
    filesData.forEach(file => {
        const cat = file.kategori || 'Lainnya';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(file);
    });
    
    filesList.innerHTML = Object.keys(categories).map(category => `
        <div class="file-category">
            <h4 class="category-title">${getCategoryIcon(category)} ${category}</h4>
            <div class="files-grid">
                ${categories[category].map(file => `
                    <div class="file-card">
                        <div class="file-card-icon">${file.icon || '📄'}</div>
                        <div class="file-card-content">
                            <div class="file-card-name">${escapeHtml(file.nama)}</div>
                            ${file.deskripsi ? `<div class="file-card-desc">${escapeHtml(file.deskripsi)}</div>` : ''}
                            ${file.ukuran ? `<div class="file-card-size">📦 ${file.ukuran}</div>` : ''}
                        </div>
                        <div class="file-card-actions">
                            <a href="${file.link}" target="_blank" class="btn-file-download">
                                📥 Download
                            </a>
                            ${(currentUserRole === 'admin' || currentUserRole === 'developer') ? `
                                <button onclick="deleteFile('${file.id}')" class="btn-file-delete" title="Hapus">🗑️</button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        'Proposal': '📄',
        'Rundown': '📋',
        'Anggaran': '💰',
        'Surat': '✉️',
        'Dokumentasi': '📸',
        'Template': '📝',
        'Lainnya': '📁'
    };
    return icons[category] || '📁';
}

async function handleAddFile(e) {
    e.preventDefault();
    
    const fileData = {
        nama: document.getElementById('fileName').value,
        deskripsi: document.getElementById('fileDesc').value,
        kategori: document.getElementById('fileCategory').value,
        link: document.getElementById('fileLink').value,
        icon: document.getElementById('fileIcon').value || '📄',
        ukuran: document.getElementById('fileSize').value || '',
        uploadedBy: currentUser,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    showLoading();
    try {
        await db.collection('files').add(fileData);
        await loadFilesFromFirebase();
        renderFilesList();
        
        e.target.reset();
        alert('✅ File berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding file:', error);
        alert('❌ Gagal menambahkan file.');
    } finally {
        hideLoading();
    }
}

async function deleteFile(fileId) {
    if (!confirm('Yakin ingin menghapus file ini?')) return;
    
    showLoading();
    try {
        await db.collection('files').doc(fileId).delete();
        await loadFilesFromFirebase();
        renderFilesList();
        alert('✅ File berhasil dihapus!');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Gagal menghapus file.');
    } finally {
        hideLoading();
    }
}

// Init form submit untuk file upload
document.addEventListener('DOMContentLoaded', function() {
    const fileForm = document.getElementById('fileUploadForm');
    if (fileForm) {
        fileForm.addEventListener('submit', handleAddFile);
    }
});

// Init form submit untuk file upload
document.addEventListener('DOMContentLoaded', function() {
    const fileForm = document.getElementById('fileUploadForm');
    if (fileForm) {
        fileForm.addEventListener('submit', handleAddFile);
    }
});


// Initialize
document.getElementById('inputTab').style.display = 'block';
