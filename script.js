let playlist = [];
let currentIndex = 0;
let quranData = {}; 

const surahNames = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];
const surahCounts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

const reciterSelect = document.getElementById('reciterSelect');
const typeSelect = document.getElementById('typeSelect');
const contentLabel = document.getElementById('contentLabel');
const contentSelect = document.getElementById('contentSelect');
const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');
const ayahImage = document.getElementById('ayahImage');
const playbackControls = document.getElementById('playbackControls');
const ayahSelect = document.getElementById('ayahSelect');
const pauseBtn = document.getElementById('pauseBtn'); 

// عناصر التفسير
const toggleTafsirBtn = document.getElementById('toggleTafsirBtn');
const tafsirContainer = document.getElementById('tafsirContainer');
const tafsirText = document.getElementById('tafsirText');
let isTafsirVisible = false;

let audioPlayers = [document.getElementById('audioA'), document.getElementById('audioB')];
let currentPlayerIndex = 0; 
let isPaused = false;
let checkTimeInterval;

// إظهار وإخفاء التفسير
toggleTafsirBtn.onclick = () => {
    isTafsirVisible = !isTafsirVisible;
    tafsirContainer.style.display = isTafsirVisible ? "block" : "none";
    toggleTafsirBtn.innerText = isTafsirVisible ? "📖 إخفاء التفسير" : "📖 إظهار التفسير الميسر";
};

fetch('data.json?v=' + new Date().getTime())
    .then(r => r.json())
    .then(data => {
        quranData = data;
        data.reciters.forEach(r => {
            reciterSelect.add(new Option(r.name, r.folder));
        });
        updateContentDropdown();
        statusDiv.innerText = "جاهز. اختر ما تريد الاستماع إليه.";
    });

function updateContentDropdown() {
    contentSelect.innerHTML = "";
    if (typeSelect.value === 'subjective') {
        contentLabel.innerText = "اختر الموضوع:";
        quranData.topics.forEach(t => {
            contentSelect.add(new Option(t.title, t.id));
        });
    } else {
        contentLabel.innerText = "اختر السورة:";
        surahNames.forEach((name, index) => {
            contentSelect.add(new Option(`${index + 1}. سورة ${name}`, index + 1));
        });
    }
}

typeSelect.addEventListener('change', updateContentDropdown);

function buildPlaylistAndPlay() {
    playlist = [];
    currentIndex = 0;
    ayahSelect.innerHTML = "";
    let lastSurahId = -1;

    if (typeSelect.value === 'subjective') {
        const selectedTopic = quranData.topics.find(t => t.id === contentSelect.value);
        selectedTopic.sections.forEach(section => {
            if (section.surah !== lastSurahId && section.surah !== 9) {
                playlist.push({ isBasmala: true });
                ayahSelect.add(new Option(`--- بسم الله الرحمن الرحيم ---`, playlist.length - 1));
            }
            lastSurahId = section.surah;

            for(let i = section.start; i <= section.end; i++) {
                playlist.push({ surah: section.surah, ayah: i, name: section.name });
                ayahSelect.add(new Option(`${section.name} - آية ${i}`, playlist.length - 1));
            }
        });
    } else {
        const surahId = parseInt(contentSelect.value);
        const surahName = surahNames[surahId - 1];
        const totalAyahs = surahCounts[surahId - 1];
        
        if (surahId !== 9) {
            playlist.push({ isBasmala: true });
            ayahSelect.add(new Option(`--- بسم الله الرحمن الرحيم ---`, playlist.length - 1));
        }

        for(let i = 1; i <= totalAyahs; i++) {
            playlist.push({ surah: surahId, ayah: i, name: `سورة ${surahName}` });
            ayahSelect.add(new Option(`سورة ${surahName} - آية ${i}`, playlist.length - 1));
        }
    }
    
    playbackControls.style.display = "block";
    playAyah(0);
}

function getAudioUrl(index) {
    const item = playlist[index];
    const reciterFolder = reciterSelect.value;
    
    if (item.isBasmala) return `https://everyayah.com/data/${reciterFolder}/001001.mp3`;

    const s = String(item.surah).padStart(3, '0');
    const a = String(item.ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciterFolder}/${s}${a}.mp3`;
}

// دالة جلب التفسير
function fetchTafsir(surah, ayah) {
    tafsirText.innerText = "جاري تحميل التفسير...";
    fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.muyassar`)
        .then(res => res.json())
        .then(data => {
            if(data.data && data.data.text) {
                tafsirText.innerText = data.data.text;
            } else {
                tafsirText.innerText = "التفسير غير متاح حالياً.";
            }
        })
        .catch(err => {
            console.error("Error fetching tafsir:", err);
            tafsirText.innerText = "حدث خطأ في تحميل التفسير. تأكد من اتصال الإنترنت.";
        });
}

function playAyah(index) {
    if (index >= playlist.length) {
        statusDiv.innerText = "انتهت التلاوة.";
        ayahImage.style.display = "none";
        tafsirContainer.style.display = "none";
        return;
    }
    
    if(checkTimeInterval) clearInterval(checkTimeInterval);

    currentIndex = index;
    ayahSelect.value = currentIndex;
    
    isPaused = false;
    pauseBtn.innerText = "إيقاف ⏸️";
    pauseBtn.style.backgroundColor = "#e67e22";
    
    const nextPlayerIndex = (currentPlayerIndex + 1) % 2;
    const activePlayer = audioPlayers[currentPlayerIndex];
    const nextPlayer = audioPlayers[nextPlayerIndex];
    
    const item = playlist[index];
    
    if (item.isBasmala) {
        statusDiv.innerText = "تلاوة: بسم الله الرحمن الرحيم";
        ayahImage.src = `https://everyayah.com/data/images_png/1_1.png`;
        tafsirText.innerText = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ."; // تفسير افتراضي للبسملة
    } else {
        statusDiv.innerText = `تلاوة: ${item.name} - آية ${item.ayah}`;
        ayahImage.src = `https://everyayah.com/data/images_png/${item.surah}_${item.ayah}.png`;
        fetchTafsir(item.surah, item.ayah); // استدعاء التفسير أوتوماتيك
    }
    
    ayahImage.style.display = "block";

    activePlayer.src = getAudioUrl(index);
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
                startTransition();
            }
        }
    }, 50); 
}

function startTransition() {
    currentPlayerIndex = (currentPlayerIndex + 1) % 2;
    playAyah(currentIndex + 1);
}

pauseBtn.onclick = () => {
    const activePlayer = audioPlayers[currentPlayerIndex];
    if (isPaused) {
        activePlayer.play();
        pauseBtn.innerText = "إيقاف ⏸️";
        pauseBtn.style.backgroundColor = "#e67e22"; 
        isPaused = false;
    } else {
        activePlayer.pause();
        pauseBtn.innerText = "تشغيل ▶️";
        pauseBtn.style.backgroundColor = "#27ae60"; 
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

playBtn.onclick = buildPlaylistAndPlay;

ayahSelect.onchange = (e) => {
    audioPlayers.forEach(p => p.pause());
    playAyah(parseInt(e.target.value));
};
