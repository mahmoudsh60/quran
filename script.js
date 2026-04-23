// --- تسجيل الـ Service Worker وإظهار زر التثبيت PWA ---
let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installAppBtn.style.display = 'block';
});

installAppBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installAppBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Reg failed', err));
    });
}

let playlist = [];
let currentIndex = 0;
let quranData = {}; 
let isPlaylistLooping = false; 

const surahNames = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];
const surahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const settingsPanel = document.getElementById('settingsPanel');
const overlay = document.getElementById('overlay');
const resumeBtn = document.getElementById('resumeBtn');
const shareBtn = document.getElementById('shareBtn');
const loopToggleBtn = document.getElementById('loopToggleBtn');
const currentTopicName = document.getElementById('currentTopicName');

function toggleMenu() {
    settingsPanel.classList.toggle('active');
    overlay.classList.toggle('active');
}
openMenuBtn.onclick = toggleMenu;
closeMenuBtn.onclick = toggleMenu;
overlay.onclick = toggleMenu;

const reciterSelect = document.getElementById('reciterSelect');
const typeSelect = document.getElementById('typeSelect');
const contentLabel = document.getElementById('contentLabel');
const contentSelect = document.getElementById('contentSelect');
const fullSurahOptions = document.getElementById('fullSurahOptions');
const playbackSpeed = document.getElementById('playbackSpeed');
const applyRepeatBtn = document.getElementById('applyRepeatBtn');

const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');
const ayahImage = document.getElementById('ayahImage');
const playbackControls = document.getElementById('playbackControls');
const ayahSelect = document.getElementById('ayahSelect');
const pauseBtn = document.getElementById('pauseBtn'); 

const toggleTafsirBtn = document.getElementById('toggleTafsirBtn');
const tafsirContainer = document.getElementById('tafsirContainer');
const tafsirText = document.getElementById('tafsirText');
let isTafsirVisible = false;

let audioPlayers = [document.getElementById('audioA'), document.getElementById('audioB')];
let currentPlayerIndex = 0; 
let isPaused = false;
let checkTimeInterval;

loopToggleBtn.onclick = () => {
    isPlaylistLooping = !isPlaylistLooping;
    loopToggleBtn.classList.toggle('active');
    loopToggleBtn.innerText = isPlaylistLooping ? "🔁 التكرار مفعل" : "🔁 تكرار القائمة";
};

toggleTafsirBtn.onclick = () => {
    isTafsirVisible = !isTafsirVisible;
    tafsirContainer.style.display = isTafsirVisible ? "block" : "none";
};

// تحديث سرعة التلاوة
playbackSpeed.addEventListener('change', (e) => {
    const speed = parseFloat(e.target.value);
    audioPlayers.forEach(player => player.playbackRate = speed);
});

// رسالة المشاركة التحفيزية
shareBtn.onclick = () => {
    const shareText = `السلام عليكم. جربت تستقطع دقايق من يومك تسمع آيات تريح قلبك؟ ✨\nأنا بستمع دلوقتي لـ "${currentTopicName.innerText}" بتلاوة خاشعة.\n\nاستمع وتدبر وشاركني الأجر، لعلها تكون صدقة جارية لي ولك وللجميع 🤍\nالدال على الخير كفاعله: ${window.location.href}`;
    if (navigator.share) {
        navigator.share({ title: 'تلاوة تريح القلب', text: shareText, url: window.location.href }).catch(console.error);
    } else {
        navigator.clipboard.writeText(shareText);
        alert("تم نسخ رسالة المشاركة! ابعتها لأصحابك وشارك الأجر.");
    }
};

fetch('data.json?v=' + new Date().getTime())
    .then(r => r.json())
    .then(data => {
        quranData = data;
        data.reciters.forEach(r => {
            reciterSelect.add(new Option(r.name, r.folder));
        });
        
        // ياسر الدوسري افتراضي
        reciterSelect.value = "Yasser_Ad-Dussary_128kbps";
        updateContentDropdown();
        
        const savedSession = JSON.parse(localStorage.getItem('quran_saved_session'));
        if (savedSession) {
            resumeBtn.style.display = "inline-block";
            resumeBtn.onclick = () => {
                reciterSelect.value = savedSession.reciter;
                typeSelect.value = savedSession.type;
                updateContentDropdown();
                setTimeout(() => {
                    contentSelect.value = savedSession.content;
                    buildPlaylistAndPlay(savedSession.index);
                    resumeBtn.style.display = "none";
                }, 100);
            };
        }
    });

function updateContentDropdown() {
    contentSelect.innerHTML = "";
    if (typeSelect.value === 'subjective') {
        contentLabel.innerText = "اختر الموضوع:";
        fullSurahOptions.style.display = "none"; 
        quranData.topics.forEach(t => {
            contentSelect.add(new Option(t.title, t.id));
        });
    } else {
        contentLabel.innerText = "اختر السورة:";
        fullSurahOptions.style.display = "flex"; 
        surahNames.forEach((name, index) => {
            contentSelect.add(new Option(`${index + 1}. سورة ${name}`, index + 1));
        });
        updateAyahLimits();
    }
}

function updateAyahLimits() {
    if (typeSelect.value !== 'full') return;
    const surahId = parseInt(contentSelect.value);
    const totalAyahs = surahCounts[surahId - 1];
    document.getElementById('endAyahInput').value = totalAyahs;
    document.getElementById('endAyahInput').max = totalAyahs;
    document.getElementById('startAyahInput').max = totalAyahs;
}

typeSelect.addEventListener('change', updateContentDropdown);
contentSelect.addEventListener('change', updateAyahLimits);

function buildPlaylistAndPlay(startIndex = 0) {
    playlist = [];
    currentIndex = startIndex; 
    ayahSelect.innerHTML = "";
    let lastSurahId = -1;
    let repeatCount = parseInt(document.getElementById('ayahRepeatInput').value) || 1;

    // تعيين اسم الموضوع أو السورة فوق
    currentTopicName.innerText = contentSelect.options[contentSelect.selectedIndex].text;

    if (typeSelect.value === 'subjective') {
        const selectedTopic = quranData.topics.find(t => t.id === contentSelect.value);
        selectedTopic.sections.forEach(section => {
            if (section.surah !== lastSurahId && section.surah !== 9) {
                playlist.push({ isBasmala: true });
                ayahSelect.add(new Option(`--- البسملة ---`, playlist.length - 1));
            }
            lastSurahId = section.surah;

            for(let i = section.start; i <= section.end; i++) {
                for(let r = 0; r < repeatCount; r++) {
                    let rText = repeatCount > 1 ? ` (تكرار ${r+1})` : '';
                    playlist.push({ surah: section.surah, ayah: i, name: section.name + rText });
                    ayahSelect.add(new Option(`${section.name} - آية ${i}${rText}`, playlist.length - 1));
                }
            }
        });
    } else {
        const surahId = parseInt(contentSelect.value);
        const surahName = surahNames[surahId - 1];
        const totalAyahs = surahCounts[surahId - 1];
        
        let startA = parseInt(document.getElementById('startAyahInput').value) || 1;
        let endA = parseInt(document.getElementById('endAyahInput').value) || totalAyahs;

        if(startA < 1) startA = 1;
        if(endA > totalAyahs) endA = totalAyahs;
        if(startA > endA) startA = endA;

        if (surahId !== 9 && startA === 1) {
            playlist.push({ isBasmala: true });
            ayahSelect.add(new Option(`--- البسملة ---`, playlist.length - 1));
        }

        for(let i = startA; i <= endA; i++) {
            for(let r = 0; r < repeatCount; r++) {
                let rText = repeatCount > 1 ? ` (تكرار ${r+1})` : '';
                playlist.push({ surah: surahId, ayah: i, name: `سورة ${surahName}${rText}` });
                ayahSelect.add(new Option(`سورة ${surahName} - آية ${i}${rText}`, playlist.length - 1));
            }
        }
    }
    
    settingsPanel.classList.remove('active');
    overlay.classList.remove('active');
    playbackControls.style.display = "block";
    resumeBtn.style.display = "none";
    playAyah(currentIndex);
}

function getAudioUrl(index) {
    const item = playlist[index];
    const reciterFolder = reciterSelect.value;
    if (item.isBasmala) return `https://everyayah.com/data/${reciterFolder}/001001.mp3`;
    const s = String(item.surah).padStart(3, '0');
    const a = String(item.ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciterFolder}/${s}${a}.mp3`;
}

function fetchTafsir(surah, ayah) {
    tafsirText.innerText = "جاري تحميل التفسير...";
    fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.muyassar`)
        .then(res => res.json())
        .then(data => {
            if(data.data && data.data.text) tafsirText.innerText = data.data.text;
            else tafsirText.innerText = "التفسير غير متاح حالياً.";
        })
        .catch(err => tafsirText.innerText = "حدث خطأ في تحميل التفسير.");
}

function playAyah(index) {
    if (index >= playlist.length) {
        if (isPlaylistLooping) {
            playAyah(0);
            return;
        }
        
        if (contentSelect.selectedIndex < contentSelect.options.length - 1) {
            contentSelect.selectedIndex += 1; 
            statusDiv.innerText = "انتهى المقطع.. جاري الانتقال للتالي...";
            setTimeout(() => buildPlaylistAndPlay(0), 1500);
        } else {
            statusDiv.innerText = "انتهت التلاوة.";
            ayahImage.style.display = "none";
        }
        return;
    }
    
    if(checkTimeInterval) clearInterval(checkTimeInterval);
    currentIndex = index;
    ayahSelect.value = currentIndex;
    
    localStorage.setItem('quran_saved_session', JSON.stringify({
        reciter: reciterSelect.value,
        type: typeSelect.value,
        content: contentSelect.value,
        index: currentIndex
    }));
    
    isPaused = false;
    pauseBtn.innerText = "⏸️ إيقاف";
    pauseBtn.style.backgroundColor = "var(--danger)";
    
    const activePlayer = audioPlayers[currentPlayerIndex];
    const nextPlayer = audioPlayers[(currentPlayerIndex + 1) % 2];
    const item = playlist[index];
    
    if (item.isBasmala) {
        statusDiv.innerText = "بسم الله الرحمن الرحيم";
        ayahImage.src = `https://everyayah.com/data/images_png/1_1.png`;
        tafsirText.innerText = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ."; 
    } else {
        statusDiv.innerText = `${item.name} - آية ${item.ayah}`;
        ayahImage.src = `https://everyayah.com/data/images_png/${item.surah}_${item.ayah}.png`;
        if(isTafsirVisible) fetchTafsir(item.surah, item.ayah); 
    }
    
    ayahImage.style.display = "block";
    activePlayer.src = getAudioUrl(index);
    
    // تطبيق السرعة
    const speed = parseFloat(playbackSpeed.value);
    activePlayer.playbackRate = speed;
    
    activePlayer.play().catch(e => console.log("تأخير في التحميل", e));

    if (index + 1 < playlist.length) {
        nextPlayer.src = getAudioUrl(index + 1);
        nextPlayer.pause(); 
    }

    checkTimeInterval = setInterval(() => {
        if (!activePlayer.paused && !isNaN(activePlayer.duration)) {
            const remaining = activePlayer.duration - activePlayer.currentTime;
            if (remaining > 0 && remaining <= 0.3) {
                clearInterval(checkTimeInterval);
                currentPlayerIndex = (currentPlayerIndex + 1) % 2;
                playAyah(currentIndex + 1);
            }
        }
    }, 50); 
}

pauseBtn.onclick = () => {
    const activePlayer = audioPlayers[currentPlayerIndex];
    if (isPaused) {
        activePlayer.play();
        pauseBtn.innerText = "⏸️ إيقاف";
        pauseBtn.style.backgroundColor = "var(--danger)"; 
        isPaused = false;
    } else {
        activePlayer.pause();
        pauseBtn.innerText = "▶️ تشغيل";
        pauseBtn.style.backgroundColor = "var(--accent)"; 
        isPaused = true;
    }
};

document.getElementById('nextBtn').onclick = () => {
    audioPlayers.forEach(p => p.pause());
    playAyah(currentIndex + 1);
};

document.getElementById('prevBtn').onclick = () => {
    audioPlayers.forEach(p => p.pause());
    playAyah(currentIndex - 1);
};

// زرار التطبيق اللي بره بيعيد بناء القائمة بالإعدادات الجديدة ويبدأ من نفس السورة
applyRepeatBtn.onclick = () => {
    audioPlayers.forEach(p => p.pause());
    buildPlaylistAndPlay(0);
};

playBtn.onclick = () => buildPlaylistAndPlay(0);

ayahSelect.onchange = (e) => {
    audioPlayers.forEach(p => p.pause());
    playAyah(parseInt(e.target.value));
};
