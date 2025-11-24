import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc,
    getDoc,
    query,
    where,
    orderBy,
    Timestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyBsUD_rxmmW5BCFK37k_0LxF1RQzYsQThI",
    authDomain: "kiblat-mpi-2026.firebaseapp.com",
    projectId: "kiblat-mpi-2026",
    storageBucket: "kiblat-mpi-2026.firebasestorage.app",
    messagingSenderId: "466657139642",
    appId: "1:466657139642:web:6981463f755ecb1b82db83",
    measurementId: "G-D77ENTXG61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully!');

// ===== DATA ANGGOTA =====
const dataAnggota = {
    "230101050652": { nama: "AHMAD RIJANI", divisi: "Inti Pelaksana", role: "admin" },
    "230101050763": { nama: "AIDA MUSLIMAH", divisi: "Inti Pelaksana", role: "admin" },
    "230101050276": { nama: "WARDATUSHOFIA", divisi: "Inti Pelaksana", role: "admin" },
    "230101050678": { nama: "MUHAMMAD BAICHAKI MAULANA", divisi: "Penanggung Jawab", role: "member" },
    
    // Divisi Acara
    "230101050654": { nama: "ALYA MUFIDA", divisi: "Acara", role: "member" },
    "230101050669": { nama: "GITALIS TAMARA PUTRI MEI DINA", divisi: "Acara", role: "member" },
    "230101050650": { nama: "AHMAD MAULANA", divisi: "Acara", role: "member" }
    // ... tambahkan anggota lainnya
};

// State management
let currentUser = null;
let currentDivisi = '';

// ===== LOAD HOMEPAGE CONTENT =====
async function loadHomepageContent() {
    try {
        const docRef = doc(db, 'homepage', 'content');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('✅ Homepage data loaded:', data);
            
            // Update homepage
            document.getElementById('latarBelakang').textContent = data.latarBelakang || 'Belum ada data';
            document.getElementById('sosmedInstagram').textContent = data.sosmedInstagram || '-';
            document.getElementById('sosmedTiktok').textContent = data.sosmedTiktok || '-';
            
            // Update dashboard home
            const dashboardLatar = document.getElementById('homepageLatarBelakang');
            if (dashboardLatar) {
                dashboardLatar.textContent = data.latarBelakang || 'Belum ada data';
            }
        } else {
            console.log('❌ Document "content" tidak ditemukan!');
            document.getElementById('latarBelakang').textContent = 'Data tidak tersedia';
        }
    } catch (error) {
        console.error('❌ Error loading homepage:', error);
        document.getElementById('latarBelakang').textContent = 'Error memuat data';
    }
}

// ===== NAVIGATION =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

window.showLoginPage = function(mode) {
    const title = document.getElementById('loginTitle');
    const passwordGroup = document.getElementById('passwordGroup');
    
    if (mode === 'admin') {
        title.textContent = 'Login Admin';
        passwordGroup.style.display = 'block';
        document.getElementById('loginForm').dataset.mode = 'admin';
    } else {
        title.textContent = 'Login Anggota';
        passwordGroup.style.display = 'none';
        document.getElementById('loginForm').dataset.mode = 'member';
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
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nim = document.getElementById('nimInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const mode = this.dataset.mode;
    
    console.log('🔐 Login attempt:', { nim, mode });
    
    if (mode === 'admin') {
        if (password === 'karya rija' && dataAnggota[nim] && dataAnggota[nim].role === 'admin') {
            currentUser = { ...dataAnggota[nim], nim, mode: 'admin' };
            loadDashboard();
        } else {
            alert('NIM atau Password admin salah!');
        }
    } else {
        if (dataAnggota[nim]) {
            currentUser = { ...dataAnggota[nim], nim, mode: 'member' };
            loadDashboard();
        } else {
            alert('NIM tidak terdaftar!');
        }
    }
});

function loadDashboard() {
    console.log('✅ Login successful:', currentUser);
    
    document.getElementById('userName').textContent = currentUser.nama;
    document.getElementById('userNim').textContent = currentUser.nim;
    
    // Show admin menu if admin
    if (currentUser.mode === 'admin') {
        document.getElementById('adminMenu').style.display = 'block';
    } else {
        document.getElementById('adminMenu').style.display = 'none';
    }
    
    showPage('dashboard');
    showSection('home');
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
        'edit-homepage': 'editHomepageSection'
    };
    
    if (sections[sectionName]) {
        document.getElementById(sections[sectionName]).classList.add('active');
        
        if (sectionName === 'jadwal') loadJadwalAdmin();
        if (sectionName === 'edit-homepage') loadEditHomepage();
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
    
    console.log('📝 Adding todo:', todoData);
    
    try {
        const docRef = await addDoc(collection(db, 'todos'), todoData);
        console.log('✅ Todo added with ID:', docRef.id);
        alert('To-Do berhasil ditambahkan!');
        document.getElementById('todoForm').reset();
        loadTodoList();
    } catch (error) {
        console.error('❌ Error adding todo:', error);
        alert('Gagal menambahkan to-do: ' + error.message);
    }
});

async function loadTodoList() {
    console.log('📋 Loading todos for divisi:', currentDivisi);
    
    try {
        const q = query(
            collection(db, 'todos'),
            where('divisi', '==', currentDivisi)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('✅ Found', querySnapshot.size, 'todos');
        
        const todoPenting = document.getElementById('todoPenting');
        const todoSedang = document.getElementById('todoSedang');
        const todoTidak = document.getElementById('todoTidak');
        const todoSelesai = document.getElementById('todoSelesai');
        
        todoPenting.innerHTML = '';
        todoSedang.innerHTML = '';
        todoTidak.innerHTML = '';
        todoSelesai.innerHTML = '';
        
        if (querySnapshot.empty) {
            todoPenting.innerHTML = '<p class="empty-message">Belum ada to-do</p>';
        }
        
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
    } catch (error) {
        console.error('❌ Error loading todos:', error);
        document.getElementById('todoPenting').innerHTML = '<p class="error-message">Error memuat data: ' + error.message + '</p>';
    }
}

function createTodoElement(todo, id) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.selesai ? 'selesai' : ''}`;
    
    div.innerHTML = `
        <div class="todo-info">
            <h4>${todo.namaKegiatan}</h4>
            <p>📅 ${todo.tanggal} | ⏰ ${todo.waktu} WITA</p>
            <p>${todo.deskripsi || '-'}</p>
        </div>
        <div class="todo-actions">
            <button class="icon-btn" onclick="toggleSelesai('${id}', ${!todo.selesai})" title="${todo.selesai ? 'Tandai belum selesai' : 'Tandai selesai'}">
                ${todo.selesai ? '↩️' : '✅'}
            </button>
            <button class="icon-btn" onclick="deleteTodo('${id}')" title="Hapus">🗑️</button>
        </div>
    `;
    
    return div;
}

window.toggleSelesai = async function(id, selesai) {
    try {
        await updateDoc(doc(db, 'todos', id), { selesai });
        console.log('✅ Todo updated:', id);
        loadTodoList();
    } catch (error) {
        console.error('❌ Error toggling selesai:', error);
        alert('Gagal update status: ' + error.message);
    }
}

window.deleteTodo = async function(id) {
    if (confirm('Hapus to-do ini?')) {
        try {
            await deleteDoc(doc(db, 'todos', id));
            console.log('✅ Todo deleted:', id);
            loadTodoList();
        } catch (error) {
            console.error('❌ Error deleting todo:', error);
            alert('Gagal menghapus: ' + error.message);
        }
    }
}

// ===== JADWAL ADMIN =====
async function loadJadwalAdmin() {
    try {
        const querySnapshot = await getDocs(collection(db, 'jadwalAdmin'));
        const jadwalList = document.getElementById('jadwalList');
        
        jadwalList.innerHTML = '';
        
        if (querySnapshot.empty) {
            jadwalList.innerHTML = '<p class="empty-message">Belum ada jadwal dari admin</p>';
            return;
        }
        
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
    } catch (error) {
        console.error('❌ Error loading jadwal:', error);
        document.getElementById('jadwalList').innerHTML = '<p class="error-message">Error memuat jadwal</p>';
    }
}

// ===== EDIT HOMEPAGE =====
async function loadEditHomepage() {
    try {
        const docRef = doc(db, 'homepage', 'content');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('editLatarBelakang').value = data.latarBelakang || '';
            document.getElementById('editInstagram').value = data.sosmedInstagram || '';
            document.getElementById('editTiktok').value = data.sosmedTiktok || '';
        }
    } catch (error) {
        console.error('❌ Error loading edit homepage:', error);
    }
}

document.getElementById('homepageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const data = {
        latarBelakang: document.getElementById('editLatarBelakang').value,
        sosmedInstagram: document.getElementById('editInstagram').value,
        sosmedTiktok: document.getElementById('editTiktok').value
    };
    
    try {
        await updateDoc(doc(db, 'homepage', 'content'), data);
        alert('Homepage berhasil diupdate!');
        loadHomepageContent();
    } catch (error) {
        console.error('❌ Error updating homepage:', error);
        alert('Gagal update: ' + error.message);
    }
});

// ===== INIT =====
window.addEventListener('load', function() {
    console.log('🚀 App loaded!');
    showPage('homepage');
    loadHomepageContent();
});
