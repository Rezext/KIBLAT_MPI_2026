// ===== GLOBAL VARIABLES =====
let isDevLoggedIn = false;
const DEV_PASSWORD = '060972';

// Firebase Collections
const landingCollection = db.collection('landing');
const dokumentasiCollection = db.collection('dokumentasi');
const beritaCollection = db.collection('berita');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initNavbar();
    initSmoothScroll();
    initDevLogin();
    initEditModal();
    loadLandingData();
});

// ===== NAVBAR TOGGLE =====
function initNavbar() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when clicking link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== DEVELOPER LOGIN =====
function initDevLogin() {
    const devEditBtn = document.getElementById('devEditBtn');
    const devLoginModal = document.getElementById('devLoginModal');
    const devLoginForm = document.getElementById('devLoginForm');
    const closeButtons = document.querySelectorAll('.close');

    if (devEditBtn) {
        devEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isDevLoggedIn) {
                openEditModal();
            } else {
                devLoginModal.style.display = 'block';
            }
        });
    }

    if (devLoginForm) {
        devLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('devPassword').value;
            
            if (password === DEV_PASSWORD) {
                isDevLoggedIn = true;
                devLoginModal.style.display = 'none';
                document.getElementById('devPassword').value = '';
                openEditModal();
            } else {
                showDevError('❌ Password salah!');
            }
        });
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function showDevError(message) {
    const errorEl = document.getElementById('devError');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 3000);
}

// ===== EDIT MODAL =====
function initEditModal() {
    const editTabs = document.querySelectorAll('.edit-tab-btn');
    
    editTabs.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            editTabs.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.edit-section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.getElementById(`edit${capitalize(tab)}`).classList.add('active');
            
            if (tab === 'dokumentasi') {
                loadDokumentasiList();
            } else if (tab === 'berita') {
                loadBeritaList();
            }
        });
    });
}

function openEditModal() {
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'block';
    
    // Load current data
    loadEditData();
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== LOAD LANDING DATA =====
async function loadLandingData() {
    showLoading();
    try {
        await loadHeroData();
        await loadAboutData();
        await loadDokumentasiData();
        await loadBeritaData();
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        hideLoading();
    }
}

// ===== HERO DATA =====
async function loadHeroData() {
    try {
        const doc = await landingCollection.doc('hero').get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('heroTitle').textContent = data.title || 'KIBLAT MPI 2026';
            document.getElementById('heroSubtitle').textContent = data.subtitle || 'Kompetisi Ilmiah dan Budaya Lintas Atlet Bertalenta';
            document.getElementById('heroDesc').textContent = data.description || 'Event tahunan mahasiswa Manajemen Pendidikan Islam 2023 UIN Antasari Banjarmasin';
        }
    } catch (error) {
        console.error('Error loading hero:', error);
    }
}

async function loadEditData() {
    try {
        const doc = await landingCollection.doc('hero').get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('editHeroTitle').value = data.title || '';
            document.getElementById('editHeroSubtitle').value = data.subtitle || '';
            document.getElementById('editHeroDesc').value = data.description || '';
        }
        
        const aboutDoc = await landingCollection.doc('about').get();
        if (aboutDoc.exists) {
            const aboutData = aboutDoc.data();
            document.getElementById('editAboutContent').value = aboutData.content || '';
        }
    } catch (error) {
        console.error('Error loading edit data:', error);
    }
}

async function saveHero() {
    showLoading();
    try {
        const data = {
            title: document.getElementById('editHeroTitle').value,
            subtitle: document.getElementById('editHeroSubtitle').value,
            description: document.getElementById('editHeroDesc').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await landingCollection.doc('hero').set(data);
        
        // Update display
        document.getElementById('heroTitle').textContent = data.title;
        document.getElementById('heroSubtitle').textContent = data.subtitle;
        document.getElementById('heroDesc').textContent = data.description;
        
        alert('✅ Hero section berhasil disimpan!');
    } catch (error) {
        console.error('Error saving hero:', error);
        alert('❌ Gagal menyimpan. Cek koneksi internet.');
    } finally {
        hideLoading();
    }
}

// ===== ABOUT DATA =====
async function loadAboutData() {
    try {
        const doc = await landingCollection.doc('about').get();
        if (doc.exists) {
            const data = doc.data();
            const content = data.content || 'KIBLAT (Kompetisi Ilmiah dan Budaya Lintas Atlet Bertalenta) merupakan event tahunan yang diselenggarakan oleh mahasiswa Manajemen Pendidikan Islam angkatan 2023 UIN Antasari Banjarmasin.\n\nEvent ini bertujuan untuk mengembangkan potensi mahasiswa dalam bidang akademik, seni, budaya, dan olahraga melalui berbagai perlombaan dan kegiatan yang menarik.\n\nKIBLAT 2026 menghadirkan berbagai kategori lomba yang dapat diikuti oleh mahasiswa dari berbagai universitas di Indonesia.';
            
            const paragraphs = content.split('\n').filter(p => p.trim());
            document.getElementById('aboutContent').innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
        }
    } catch (error) {
        console.error('Error loading about:', error);
    }
}

async function saveAbout() {
    showLoading();
    try {
        const content = document.getElementById('editAboutContent').value;
        
        await landingCollection.doc('about').set({
            content: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update display
        const paragraphs = content.split('\n').filter(p => p.trim());
        document.getElementById('aboutContent').innerHTML = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
        
        alert('✅ Tentang KIBLAT berhasil disimpan!');
    } catch (error) {
        console.error('Error saving about:', error);
        alert('❌ Gagal menyimpan. Cek koneksi internet.');
    } finally {
        hideLoading();
    }
}

// ===== DOKUMENTASI DATA =====
async function loadDokumentasiData() {
    try {
        const snapshot = await dokumentasiCollection.orderBy('date', 'desc').get();
        
        const grid = document.getElementById('dokumentasiGrid');
        
        if (snapshot.empty) {
            grid.innerHTML = '<div class="empty-state"><p>📸 Dokumentasi akan segera hadir</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'dok-item';
            item.innerHTML = `
                <img src="${data.url}" alt="${escapeHtml(data.title)}" class="dok-image" onerror="this.src='https://via.placeholder.com/300x250?text=No+Image'">
                <div class="dok-content">
                    <div class="dok-title">${escapeHtml(data.title)}</div>
                    <div class="dok-date">📅 ${formatDate(data.date)}</div>
                </div>
            `;
            grid.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading dokumentasi:', error);
    }
}

async function loadDokumentasiList() {
    try {
        const snapshot = await dokumentasiCollection.orderBy('date', 'desc').get();
        const list = document.getElementById('dokList');
        
        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align: center; color: #999;">Belum ada dokumentasi</p>';
            return;
        }
        
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(data.title)}</div>
                    <div class="list-item-info">📅 ${formatDate(data.date)}</div>
                </div>
                <button class="btn-delete-item" onclick="deleteDokumentasi('${doc.id}')">🗑️ Hapus</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading dok list:', error);
    }
}

async function addDokumentasi() {
    const title = document.getElementById('dokTitle').value.trim();
    const url = document.getElementById('dokUrl').value.trim();
    const date = document.getElementById('dokDate').value;
    
    if (!title || !url || !date) {
        alert('⚠️ Mohon lengkapi semua field!');
        return;
    }
    
    showLoading();
    try {
        await dokumentasiCollection.add({
            title: title,
            url: url,
            date: date,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form
        document.getElementById('dokTitle').value = '';
        document.getElementById('dokUrl').value = '';
        document.getElementById('dokDate').value = '';
        
        // Reload
        await loadDokumentasiData();
        await loadDokumentasiList();
        
        alert('✅ Dokumentasi berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding dokumentasi:', error);
        alert('❌ Gagal menambahkan. Cek koneksi internet.');
    } finally {
        hideLoading();
    }
}

async function deleteDokumentasi(id) {
    if (!confirm('Yakin ingin menghapus dokumentasi ini?')) return;
    
    showLoading();
    try {
        await dokumentasiCollection.doc(id).delete();
        await loadDokumentasiData();
        await loadDokumentasiList();
        alert('✅ Dokumentasi berhasil dihapus!');
    } catch (error) {
        console.error('Error deleting dokumentasi:', error);
        alert('❌ Gagal menghapus.');
    } finally {
        hideLoading();
    }
}

// ===== BERITA DATA =====
async function loadBeritaData() {
    try {
        const snapshot = await beritaCollection.orderBy('date', 'desc').get();
        
        const grid = document.getElementById('beritaGrid');
        
        if (snapshot.empty) {
            grid.innerHTML = '<div class="empty-state"><p>📰 Belum ada berita terkait</p></div>';
            return;
        }
        
        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'berita-item';
            item.innerHTML = `
                <div class="berita-source">${escapeHtml(data.source)}</div>
                <div class="berita-title">${escapeHtml(data.title)}</div>
                <div class="berita-date">📅 ${formatDate(data.date)}</div>
                <a href="${data.url}" target="_blank" class="berita-link">Baca Selengkapnya →</a>
            `;
            grid.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading berita:', error);
    }
}

async function loadBeritaList() {
    try {
        const snapshot = await beritaCollection.orderBy('date', 'desc').get();
        const list = document.getElementById('beritaList');
        
        if (snapshot.empty) {
            list.innerHTML = '<p style="text-align: center; color: #999;">Belum ada berita</p>';
            return;
        }
        
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(data.title)}</div>
                    <div class="list-item-info">${escapeHtml(data.source)} • 📅 ${formatDate(data.date)}</div>
                </div>
                <button class="btn-delete-item" onclick="deleteBerita('${doc.id}')">🗑️ Hapus</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading berita list:', error);
    }
}

async function addBerita() {
    const title = document.getElementById('beritaTitle').value.trim();
    const source = document.getElementById('beritaSource').value.trim();
    const url = document.getElementById('beritaUrl').value.trim();
    const date = document.getElementById('beritaDate').value;
    
    if (!title || !source || !url || !date) {
        alert('⚠️ Mohon lengkapi semua field!');
        return;
    }
    
    showLoading();
    try {
        await beritaCollection.add({
            title: title,
            source: source,
            url: url,
            date: date,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear form
        document.getElementById('beritaTitle').value = '';
        document.getElementById('beritaSource').value = '';
        document.getElementById('beritaUrl').value = '';
        document.getElementById('beritaDate').value = '';
        
        // Reload
        await loadBeritaData();
        await loadBeritaList();
        
        alert('✅ Berita berhasil ditambahkan!');
    } catch (error) {
        console.error('Error adding berita:', error);
        alert('❌ Gagal menambahkan. Cek koneksi internet.');
    } finally {
        hideLoading();
    }
}

async function deleteBerita(id) {
    if (!confirm('Yakin ingin menghapus berita ini?')) return;
    
    showLoading();
    try {
        await beritaCollection.doc(id).delete();
        await loadBeritaData();
        await loadBeritaList();
        alert('✅ Berita berhasil dihapus!');
    } catch (error) {
        console.error('Error deleting berita:', error);
        alert('❌ Gagal menghapus.');
    } finally {
        hideLoading();
    }
}

// ===== UTILITY FUNCTIONS =====
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
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

// Hamburger Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Close menu when clicking nav link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
