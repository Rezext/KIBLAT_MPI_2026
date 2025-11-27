// Data Members dari Excel
const MEMBERS_DATA = {
    // Admin NIM list
    adminNIMs: ['230101050652', '230101050763', '230101050276', '230101050678', 'ruslan'],
    
    // Developer NIM
    developerNIM: '230101050652',
    
    // Password
    adminPassword: 'karya rija',
    developerPassword: '060972',
    
    // Member list dengan divisi
    members: {
        // Penanggungjawab
        '230101050678': {
            nama: 'MUHAMMAD BAICHAKI MAULANA',
            divisi: ['acara', 'pdd', 'perleng', 'konsumsi', 'kestapen', 'keamanan', 'promosi', 'humas']
        },
        
        // Inti Pelaksana
        '230101050652': {
            nama: 'AHMAD RIJANI',
            divisi: ['acara', 'pdd', 'perleng', 'konsumsi', 'kestapen', 'keamanan', 'promosi', 'humas']
        },
        '230101050763': {
            nama: 'AIDA MUSLIMAH',
            divisi: ['acara', 'pdd', 'perleng', 'konsumsi', 'kestapen', 'keamanan', 'promosi', 'humas']
        },
        '230101050276': {
            nama: 'WARDATUSHOFIA',
            divisi: ['acara', 'pdd', 'perleng', 'konsumsi', 'kestapen', 'keamanan', 'promosi', 'humas']
        },
        
        // Divisi Acara
        '230101050654': { nama: 'ALYA MUFIDA', divisi: ['acara'] },
        '230101050669': { nama: 'GITALIS TAMARA PUTRI MEI DINA', divisi: ['acara'] },
        '230101050650': { nama: 'AHMAD MAULANA', divisi: ['acara'] },
        '230101050114': { nama: 'SITI MARDIAH', divisi: ['acara'] },
        '230101050271': { nama: 'NURHIDAYAH', divisi: ['acara'] },
        '230101050102': { nama: 'BUKHOIRI RIDWAN', divisi: ['acara'] },
        '230101050266': { nama: 'NILNA MUNA', divisi: ['acara'] },
        '241101050353': { nama: 'SHOFIA RAHMI', divisi: ['acara'] },
        '220101050238': { nama: 'MUHAMMAD JERY ROYFALDO', divisi: ['acara'] },
        
        // Divisi PDD
        '230101050269': { nama: 'NOR ALYA ANNISA', divisi: ['pdd'] },
        '230101050273': { nama: 'RIZKYA NAZWA', divisi: ['pdd'] },
        '230101050651': { nama: 'AHMAD QOSYAIRI', divisi: ['pdd'] },
        '230101050272': { nama: 'NURUL HIKMAH', divisi: ['pdd'] },
        '230101050766': { nama: 'CASILDA IMELIA SARI', divisi: ['pdd'] },
        '230101050653': { nama: 'AISYA YUMNA NAILA', divisi: ['pdd'] },
        '230101050768': { nama: 'AHMAD MIHBALI', divisi: ['pdd'] },
        '230101050105': { nama: 'KARTINAH', divisi: ['pdd'] },
        
        // Divisi Perlengkapan
        '230101050679': { nama: 'MUHAMMAD ISLAMI', divisi: ['perleng'] },
        '230101050684': { nama: 'NADIVATUL LIZAHROH', divisi: ['perleng'] },
        '230101050677': { nama: 'MUHAMMAD ARSYAD', divisi: ['perleng'] },
        '230101050676': { nama: 'MUHAMAD QURRATULAINI', divisi: ['perleng'] },
        '230101050104': { nama: 'INTAN NURLIKA SARI', divisi: ['perleng'] },
        '230101050275': { nama: 'USWATUN HASANAH', divisi: ['perleng'] },
        '230101050657': { nama: 'ANNISA AHLA', divisi: ['perleng'] },
        '230101050110': { nama: 'NOVI AMELIA', divisi: ['perleng'] },
        
        // Divisi Konsumsi
        '230101050274': { nama: 'SITI KHADIZAH', divisi: ['konsumsi'] },
        '230101050264': { nama: 'NANDA TIA INDRIAWAN', divisi: ['konsumsi'] },
        '230101050109': { nama: 'NORTAZKIA RAMADHANI', divisi: ['konsumsi'] },
        '230101050666': { nama: 'ELYA BIDARI', divisi: ['konsumsi'] },
        '230101050674': { nama: 'ISMI FITRIANI', divisi: ['konsumsi'] },
        '230101050107': { nama: 'MUTHIA NABILA', divisi: ['konsumsi'] },
        '230101050675': { nama: 'LUTFIAH PUTRI JUTA LESTARI', divisi: ['konsumsi'] },
        
        // Divisi Kestapen
        '230101050108': { nama: 'NOR HIDAYATI', divisi: ['kestapen'] },
        '230101050681': { nama: 'MUHAMMAD ROYYAN HIDAYAT', divisi: ['kestapen'] },
        '230101050682': { nama: 'MUHAMMAD SUPIAN', divisi: ['kestapen'] },
        '230101050683': { nama: 'NADIA ULFAH', divisi: ['kestapen'] },
        '230101050655': { nama: 'ANNIS SAHLA', divisi: ['kestapen'] },
        '230101050764': { nama: 'GHINA KAMILAH ARNI', divisi: ['kestapen'] },
        '230101050103': { nama: 'HILYA HIDAYATI', divisi: ['kestapen'] },
        
        // Divisi Keamanan
        '230101050670': { nama: 'HIDAYATUN NI\'MAH', divisi: ['keamanan'] },
        '230101050649': { nama: 'AHMAD ALDI', divisi: ['keamanan'] },
        '230101050277': { nama: 'ZAUHARATUL AULIA', divisi: ['keamanan'] },
        '230101050268': { nama: 'NOORRAHMAN', divisi: ['keamanan'] },
        '230101050113': { nama: 'RIFATUN NISA AL-ADILA', divisi: ['keamanan'] },
        '230101050664': { nama: 'AULIYA WULANDARI', divisi: ['keamanan'] },
        '230101050111': { nama: 'RANIA AZIRA', divisi: ['keamanan'] },
        
        // Divisi Promosi
        '230101050767': { nama: 'MUHAMMAD JAMIDI', divisi: ['promosi'] },
        '230101050115': { nama: 'SITI ROSIDAH', divisi: ['promosi'] },
        '230101050270': { nama: 'NORLATIPAH', divisi: ['promosi'] },
        '230101050765': { nama: 'NISRIN', divisi: ['promosi'] },
        '230101050265': { nama: 'NAZWA ASY SYIFA', divisi: ['promosi'] },
        '230101050665': { nama: 'DIANA AHMAD', divisi: ['promosi'] },
        '230101050648': { nama: 'AHMAD ALAMSYAH', divisi: ['promosi'] },
        '230101050663': { nama: 'AULIA RAHMAN', divisi: ['promosi'] },
        
        // Divisi Humas (Sponsorship)
        '230101050688': { nama: 'NORVILA', divisi: ['humas'] },
        '230101050680': { nama: 'MUHAMMAD LUTHFI', divisi: ['humas'] },
        '230101050672': { nama: 'HUSNA AZIZAH', divisi: ['humas'] },
        '230101050673': { nama: 'ILHAM AHZATUNNAJAH FAHMI', divisi: ['humas'] },
        '230101050112': { nama: 'RANTY SELVIA', divisi: ['humas'] },
        '230101050106': { nama: 'KHARISMA APRILLIA', divisi: ['humas'] },
        '230101050667': { nama: 'EVY NOORMALA', divisi: ['humas'] },
        '230101050267': { nama: 'NI\'MATUL UZHMA', divisi: ['humas'] }
    }
};
