import { db, storage } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc,
    query,
    where,
    orderBy,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ===== DATA ANGGOTA (dari Excel) =====
const dataAnggota = {
    "230101050652": { nama: "AHMAD RIJANI", divisi: "Inti Pelaksana", role: "admin" },
    "230101050763": { nama: "AIDA MUSLIMAH", divisi: "Inti Pelaksana", role: "admin" },
    "230101050276": { nama: "WARDATUSHOFIA", divisi: "Inti Pelaksana", role: "admin" },
    "230101050678": { nama: "MUHAMMAD BAICHAKI MAULANA", divisi: "Penanggung Jawab", role: "member" },
    
    // Divisi Acara
    "230101050654": { nama: "ALYA MUFIDA", divisi: "Acara", role: "member" },
    "230101050669": { nama: "GITALIS TAMARA PUTRI MEI DINA", divisi: "Acara", role: "member" },
    "230101050650": { nama: "AHMAD MAULANA", divisi: "Acara", role: "member" },
    "230101050114": { nama: "SITI MARDIAH", divisi: "Acara", role: "member" },
    "230101050271": { nama: "NURHIDAYAH", divisi: "Acara", role: "member" },
    "230101050102": { nama: "BUKHOIRI RIDWAN", divisi: "Acara", role: "member" },
    "230101050266": { nama: "NILNA MUNA", divisi: "Acara", role: "member" },
    "241101050353": { nama: "SHOFIA RAHMI", divisi: "Acara", role: "member" },
    "220101050238": { nama: "MUHAMMAD JERY ROYFALDO", divisi: "Acara", role: "member" },
    
    // Divisi PDD
    "230101050269": { nama: "NOR ALYA ANNISA", divisi: "PDD", role: "member" },
    "230101050273": { nama: "RIZKYA NAZWA", divisi: "PDD", role: "member" },
    "230101050651": { nama: "AHMAD QOSYAIRI", divisi: "PDD", role: "member" },
    "230101050272": { nama: "NURUL HIKMAH", divisi: "PDD", role: "member" },
    "230101050766": { nama: "CASILDA IMELIA SARI", divisi: "PDD", role: "member" },
    "230101050653": { nama: "AISYA YUMNA NAILA", divisi: "PDD", role: "member" },
    "230101050768": { nama: "AHMAD MIHBALI", divisi: "PDD", role: "member" },
    "230101050105": { nama: "KARTINAH", divisi: "PDD", role: "member" },
    
    // Divisi Perleng
    "230101050679": { nama: "MUHAMMAD ISLAMI", divisi: "Perleng", role: "member" },
    "230101050684": { nama: "NADIVATUL LIZAHROH", divisi: "Perleng", role: "member" },
    "230101050677": { nama: "MUHAMMAD ARSYAD", divisi: "Perleng", role: "member" },
    "230101050676": { nama: "MUHAMAD QURRATULAINI", divisi: "Perleng", role: "member" },
    "230101050104": { nama: "INTAN NURLIKA SARI", divisi: "Perleng", role: "member" },
    "230101050275": { nama: "USWATUN HASANAH", divisi: "Perleng", role: "member" },
    "230101050657": { nama: "ANNISA AHLA", divisi: "Perleng", role: "member" },
    "230101050110": { nama: "NOVI AMELIA", divisi: "Perleng", role: "member" },
    
    // Divisi Konsumsi
    "230101050274": { nama: "SITI KHADIZAH", divisi: "Konsumsi", role: "member" },
    "230101050264": { nama: "NANDA TIA INDRIAWAN", divisi: "Konsumsi", role: "member" },
    "230101050109": { nama: "NORTAZKIA RAMADHANI", divisi: "Konsumsi", role: "member" },
    "230101050666": { nama: "ELYA BIDARI", divisi: "Konsumsi", role: "member" },
    "230101050674": { nama: "ISMI FITRIANI", divisi: "Konsumsi", role: "member" },
    "230101050107": { nama: "MUTHIA NABILA", divisi: "Konsumsi", role: "member" },
    "230101050675": { nama: "LUTFIAH PUTRI JUTA LESTARI", divisi: "Konsumsi", role: "member" },
    
    // Divisi Kestapen
    "230101050108": { nama: "NOR HIDAYATI", divisi: "Kestapen", role: "member" },
    "230101050681": { nama: "MUHAMMAD ROYYAN HIDAYAT", divisi: "Kestapen", role: "member" },
    "230101050682": { nama: "MUHAMMAD SUPIAN", divisi: "Kestapen", role: "member" },
    "230101050683": { nama: "NADIA ULFAH", divisi: "Kestapen", role: "member" },
    "230101050655": { nama: "ANNIS SAHLA", divisi: "Kestapen", role: "member" },
    "230101050764": { nama: "GHINA KAMILAH ARNI", divisi: "Kestapen", role: "member" },
    "230101050103": { nama: "HILYA HIDAYATI", divisi: "Kestapen", role: "member" },
    
    // Divisi Keamanan
    "230101050670": { nama: "HIDAYATUN NI'MAH", divisi: "Keamanan", role: "member" },
    "230101050649": { nama: "AHMAD ALDI", divisi: "Keamanan", role: "member" },
    "230101050277": { nama: "ZAUHARATUL AULIA", divisi: "Keamanan", role: "member" },
    "230101050268": { nama: "NOORRAHMAN", divisi: "Keamanan", role: "member" },
    "230101050113": { nama: "RIFATUN NISA AL-ADILA", divisi: "Keamanan", role: "member" },
    "230101050664": { nama: "AULIYA WULANDARI", divisi: "Keamanan", role: "member" },
    "230101050111": { nama: "RANIA AZIRA", divisi: "Keamanan", role: "member" },
    
    // Divisi Promosi
    "230101050767": { nama: "MUHAMMAD JAMIDI", divisi: "Promosi", role: "member" },
    "230101050115": { nama: "SITI ROSIDAH", divisi: "Promosi", role: "member" },
    "230101050270": { nama: "NORLATIPAH", divisi: "Promosi", role: "member" },
    "230101050765": { nama: "NISRIN", divisi: "Promosi", role: "member" },
    "230101050265": { nama: "NAZWA ASY SYIFA", divisi: "Promosi", role: "member" },
    "230101050665": { nama: "DIANA AHMAD", divisi: "Promosi", role: "member" },
    "230101050648": { nama: "AHMAD ALAMSYAH", divisi: "Promosi", role: "member" },
    "230101050663": { nama: "AULIA RAHMAN", divisi: "Promosi", role: "member" },
    
    // Divisi Sponsorship (Humas)
    "230101050688": { nama: "NORVILA", divisi: "Sponsorship", role: "member" },
    "230101050680": { nama: "MUHAMMAD LUTHFI", divisi: "Sponsorship", role: "member" },
    "230101050672": { nama: "HUSNA AZIZAH", divisi: "Sponsorship", role: "member" },
    "230101050673": { nama: "ILHAM AHZATUNNAJAH FAHMI", divisi: "Sponsorship", role: "member" },
    "230101050112": { nama: "RANTY SELVIA", divisi: "Sponsorship", role: "member" },
    "230101050106": { nama: "KHARISMA APRILLIA", divisi: "Sponsorship", role: "member" },
    "230101050667": { nama: "EVY NOORMALA", divisi: "Sponsorship", role: "member" },
    "230101050267": { nama: "NI'MATUL UZHMA", divisi: "Sponsorship", role: "member" }
};

// State management
let currentUser = null;
let currentDivisi = '';
let currentMode = 'member'; // member, admin, developer

// ===== UTILITY FUNCTIONS =====
async function logDeviceAccess(nim, nama) {
    try {
        const userAgent = navigator.userAgent;
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        await addDoc(collection(db, 'deviceLogs'), {
            nim,
            nama,
            ip: data.ip,
            device: userAgent,
            loginAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error logging device:', error);
    }
}

function getWITATime() {
    const now = new Date();
    const witaOffset = 8 * 60; // WITA = UTC+8
    const localOffset = now.getTimezoneOffset();
    const witaTime = new Date(now.getTime() + (witaOffset + localOffset) * 60000);
    return witaTime;
}

// ===== NAVIGATION FUNCTIONS =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

window.showLoginPage = function(mode) {
    currentMode = mode;
    const title = document.getElementById('loginTitle');
    const passwordGroup = document.getElementById('passwordGroup');
    
    if (mode === 'admin') {
        title.textContent = 'Login Admin';
        passwordGroup.style.display = 'block';
    } else if (mode === 'developer') {
        title.textContent = 'Login Developer';
        passwordGroup.style.display = 'block';
    } else {
        title.textContent = 'Login Anggota';
        passwordGroup.style.display = 'none';
    }
    
    showPage('loginPage');
}

window.backToHome = function() {
    showPage('homepage');
}

window.logout = function() {
    currentUser = null;
    currentDivisi = '';
    showPage('homepage');
}

// ===== LOGIN HANDLER =====
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nim = document.getElementById('nimInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    
    if (currentMode === 'developer') {
        if (password === '060972' && nim === '230101050652') {
            currentUser = dataAnggota[nim];
            currentUser.nim = nim;
            currentUser.mode = 'developer';
            await logDeviceAccess(nim, currentUser.nama);
            loadDashboard();
        } else {
            alert('NIM atau Password salah!');
        }
    } else if (currentMode === 'admin') {
        if (password === 'karya rija' && ['230101050652', '230101050763', '230101050276'].includes(nim)) {
            currentUser = dataAnggota[nim];
            currentUser.nim = nim;
            currentUser.mode = 'admin';
            await logDeviceAccess(nim, currentUser.nama);
            loadDashboard();
        } else {
            alert('NIM atau Password admin salah!');
        }
    } else {
        if (dataAnggota[nim]) {
            currentUser = dataAnggota[nim];
            currentUser.nim = nim;
            currentUser.mode = 'member';
            await logDeviceAccess(nim, currentUser.nama);
            loadDashboard();
        } else {
            alert('NIM tidak terdaftar!');
        }
    }
});

function loadDashboard() {
    document.getElementById('userName').textContent = currentUser.nama;
    document.getElementById('userNim').textContent = currentUser.nim;
    
    // Show menu based on role
    if (currentUser.mode === 'admin') {
        document.getElementById('adminMenu').style.display = 'block';
    }
    if (currentUser.mode === 'developer') {
        document.getElementById('devMenu').style.display = 'block';
        document.getElementById('adminMenu').style.display = 'block';
    }
    
    showPage('dashboard');
    showSection('home');
    loadTotalAnggota();
}

// ===== SECTION NAVIGATION =====
window.showSection = function(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const sections = {
        'home': 'homeSection',
        'cp': 'cpSection',
        'jadwal': 'jadwalSection',
        'absensi': 'absensiSection',
        'kalender': 'kalenderSection',
        'upload-file': 'uploadFileSection',
        'edit-homepage': 'editHomepageSection',
        'device-logs': 'deviceLogsSection'
    };
    
    if (sections[sectionName]) {
        document.getElementById(sections[sectionName]).classList.add('active');
        
        // Load data for specific sections
        if (sectionName === 'jadwal') loadJadwalAdmin();
        if (sectionName === 'absensi') loadAbsensi();
        if (sectionName === 'device-logs') loadDeviceLogs();
        if (sectionName === 'kalender') loadKalenderBesar();
    }
}

window.showDivisi = function(divisi) {
    currentDivisi = divisi;
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('divisiSection').classList.add('active');
    document.getElementById('divisiTitle').textContent = `Divisi ${divisi}`;
    
    loadTodoList();
}

window.showTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    if (tabName === 'input') {
        document.getElementById('inputTab').classList.add('active');
    } else {
        document.getElementById('hasilTab').classList.add('active');
        loadTodoList();
    }
}

// ===== TODO FUNCTIONS =====
document.getElementById('todoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const todoData = {
        divisi: currentDivisi,
        namaKegiatan: document.getElementById('todoNama').value,
        prioritas: document.getElementById('todoPrioritas').value,
        tanggal: document.getElementById('todoTanggal').value,
        waktu: document.getElementById('todoWaktu').value,
        deskripsi: document.getElementById('todoDeskripsi').value,
        selesai: false,
        createdBy: currentUser.nim,
        createdAt: Timestamp.now()
    };
    
    try {
        await addDoc(collection(db, 'todos'), todoData);
        alert('To-Do berhasil ditambahkan!');
        document.getElementById('todoForm').reset();
        
        // Schedule notification (H-3 jam)
        scheduleNotification(todoData, 3);
        
        loadTodoList();
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Gagal menambahkan to-do');
    }
});

async function loadTodoList() {
    const q = query(
        collection(db, 'todos'),
        where('divisi', '==', currentDivisi),
        orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const todoPenting = document.getElementById('todoPenting');
    const todoSedang = document.getElementById('todoSedang');
    const todoTidak = document.getElementById('todoTidak');
    const todoSelesai = document.getElementById('todoSelesai');
    
    todoPenting.innerHTML = '';
    todoSedang.innerHTML = '';
    todoTidak.innerHTML = '';
    todoSelesai.innerHTML = '';
    
    querySnapshot.forEach((docSnap) => {
        const todo = docSnap.data();
        const todoElement = createTodoElement(todo, docSnap.id);
        
        if (todo.selesai) {
            todoSelesai.appendChild(todoElement);
        } else if (todo.prioritas === 'Penting dan mendesak') {
            todoPenting.appendChild(todoElement);
        } else if (todo.prioritas === 'Sedang') {
            todoSedang.appendChild(todoElement);
        } else {
            todoTidak.appendChild(todoElement);
        }
    });
}

function createTodoElement(todo, id) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.selesai ? 'selesai' : ''}`;
    
    div.innerHTML = `
        <div class="todo-info">
            <h4>${todo.namaKegiatan}</h4>
            <p>📅 ${todo.tanggal} | ⏰ ${todo.waktu} WITA</p>
            <p>${todo.deskripsi}</p>
        </div>
        <div class="todo-actions">
            <button class="icon-btn" onclick="toggleSelesai('${id}', ${!todo.selesai})">
                ${todo.selesai ? '↩️' : '✅'}
            </button>
            <button class="icon-btn" onclick="editTodo('${id}')">✏️</button>
        </div>
    `;
    
    return div;
}

window.toggleSelesai = async function(id, selesai) {
    try {
        await updateDoc(doc(db, 'todos', id), { selesai });
        loadTodoList();
    } catch (error) {
        console.error('Error toggling selesai:', error);
    }
}

// ===== CONTACT PERSON =====
window.callContact = function(phone, nim) {
    // Show urgent notification modal
    const modal = document.getElementById('notificationModal');
    const message = document.getElementById('notifMessage');
    
    message.textContent = `Anggota menghubungi Anda! NIM: ${nim}`;
    modal.classList.add('active');
    
    // Try to initiate call (requires user permission)
    window.location.href = `tel:${phone}`;
    
    // Send push notification to target device (requires Firebase Cloud Messaging)
    sendPushNotification(nim, 'PANGGILAN DARURAT', 'Ada anggota yang menghubungi Anda!');
}

window.answerNotification = function() {
    document.getElementById('notificationModal').classList.remove('active');
}

// ===== HELPER FUNCTIONS =====
function scheduleNotification(todoData, hoursBeforeISBN) {
    // Implementation for scheduling notifications
    // This would typically use Firebase Cloud Messaging
    console.log(`Notification scheduled for ${todoData.namaKegiatan} - H-${hoursBeforeISBN} hours`);
}

async function sendPushNotification(targetNim, title, body) {
    // Implementation for push notifications
    // Requires Firebase Cloud Messaging setup
    console.log(`Push notification sent to ${targetNim}: ${title}`);
}

async function loadTotalAnggota() {
    document.getElementById('totalAnggota').textContent = Object.keys(dataAnggota).length;
}

async function loadJadwalAdmin() {
    const q = query(collection(db, 'jadwalAdmin'), orderBy('tanggal', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const jadwalList = document.getElementById('jadwalList');
    jadwalList.innerHTML = '';
    
    querySnapshot.forEach((docSnap) => {
        const jadwal = docSnap.data();
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
            <h3>${jadwal.judul}</h3>
            <p>📅 ${jadwal.tanggal} | ⏰ ${jadwal.waktu} WITA</p>
            <p>${jadwal.deskripsi}</p>
        `;
        jadwalList.appendChild(div);
    });
}

async function loadAbsensi() {
    // Load absensi data from Firebase
    const absensiTable = document.getElementById('absensiTable');
    absensiTable.innerHTML = '<p>Data absensi akan ditampilkan di sini...</p>';
}

window.downloadAbsensi = function() {
    alert('Fitur download PDF akan segera tersedia');
}

async function loadDeviceLogs() {
    const q = query(collection(db, 'deviceLogs'), orderBy('loginAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const logsTable = document.getElementById('logsTable');
    logsTable.innerHTML = '<table><tr><th>NIM</th><th>Nama</th><th>IP</th><th>Device</th><th>Login At</th></tr>';
    
    querySnapshot.forEach((docSnap) => {
        const log = docSnap.data();
        const row = `<tr>
            <td>${log.nim}</td>
            <td>${log.nama}</td>
            <td>${log.ip}</td>
            <td>${log.device.substring(0, 50)}...</td>
            <td>${log.loginAt.toDate().toLocaleString('id-ID')}</td>
        </tr>`;
        logsTable.innerHTML += row;
    });
    
    logsTable.innerHTML += '</table>';
}

async function loadKalenderBesar() {
    // Load all todos for calendar view
    const q = query(collection(db, 'todos'), orderBy('tanggal', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const kalenderBesar = document.getElementById('kalenderBesar');
    kalenderBesar.innerHTML = '<p>Kalender besar akan ditampilkan di sini dengan semua to-do dari semua divisi...</p>';
}

// Initialize homepage on load
window.addEventListener('load', function() {
    showPage('homepage');
});
