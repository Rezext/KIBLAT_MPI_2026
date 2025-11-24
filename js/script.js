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
    
    // Load initial data dari Firebase
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
        
        // Reset todoData
        Object.keys(divisiInfo).forEach(divisi => {
            todoData[divisi] = [];
        });
        
        // Load data
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
        
        // Update local data dengan Firebase ID
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

async function saveJadwalToFirebase(jadwal) {
    showLoading();
    try {
        const docRef = await jadwalCollection.add(jadwal);
        console.log('✅ Jadwal saved to Firebase:', docRef.id);
        await loadJadwalFromFirebase();
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving jadwal:', error);
        alert('❌ Gagal menyimpan jadwal.');
    } finally {
        hideLoading();
    }
}

async function deleteJadwalFromFirebase(jadwalId) {
    showLoading();
    try {
        await jadwalCollection.doc(jadwalId).delete();
        console.log('✅ Jadwal deleted from Firebase:', jadwalId);
        await loadJadwalFromFirebase();
    } catch (error) {
        console.error('❌ Error deleting jadwal:', error);
        alert('❌ Gagal hapus jadwal.');
    } finally {
        hideLoading();
    }
}

// ===== FIREBASE: ABSENSI =====
async function loadAbsensiFromFirebase() {
    try {
        const snapshot = await absensiCollection.orderBy('tanggal', 'desc').limit(1).get();
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            absensiData = {
                id: doc.id,
                ...doc.data()
            };
        } else {
            // Default data jika belum ada
            absensiData = {
                tanggal: '2025-11-24',
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

async function saveAbsensiToFirebase(data) {
    showLoading();
    try {
        const docRef = await absensiCollection.add(data);
        console.log('✅ Absensi saved to Firebase:', docRef.id);
        await loadAbsensiFromFirebase();
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving absensi:', error);
        alert('❌ Gagal menyimpan absensi.');
    } finally {
        hideLoading();
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
        
        // Save to Firebase
        const todoId = await saveTodoToFirebase(currentDivisi, todo);
        
        if (todoId) {
            // Add to local data
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
    
    // Delete dari Firebase dan local
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
        alert('🚧 Fitur download file akan segera hadir!');
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

// Initialize
document.getElementById('inputTab').style.display = 'block';
