let playlist = [];
let currentIndex = 0;
let quranData = {}; 

const reciterSelect = document.getElementById('reciterSelect');
const topicSelect = document.getElementById('topicSelect');
const audioPlayer = document.getElementById('audioPlayer');
const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');
const ayahImage = document.getElementById('ayahImage');

// العناصر الجديدة
const playbackControls = document.getElementById('playbackControls');
const ayahSelect = document.getElementById('ayahSelect');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');

// كائن صوتي مخفي وظيفته يحمل الآية اللي عليها الدور في الخلفية
const preloader = new Audio(); 

fetch('data.json')
    .then(response => response.json())
    .then(data => {
        quranData = data;
        
        data.reciters.forEach(reciter => {
            let option = document.createElement('option');
            option.value = reciter.folder;
            option.innerText = reciter.name;
            reciterSelect.appendChild(option);
        });

        data.topics.forEach(topic => {
            let option = document.createElement('option');
            option.value = topic.id;
            option.innerText = topic.title;
            topicSelect.appendChild(option);
        });
    })
    .catch(error => console.error("Error loading JSON:", error));

function buildPlaylistAndPlay() {
    playlist = [];
    currentIndex = 0;
    ayahSelect.innerHTML = ""; // تفريغ قائمة الآيات القديمة
    
    const selectedTopicId = topicSelect.value;
    const selectedTopic = quranData.topics.find(t => t.id === selectedTopicId);
    
    selectedTopic.sections.forEach(section => {
        for(let i = section.start; i <= section.end; i++) {
            let ayahObj = { surah: section.surah, ayah: i, surahName: section.name };
            playlist.push(ayahObj);
            
            // إضافة الآية لقائمة التصفح السريع
            let option = document.createElement('option');
            option.value = playlist.length - 1; // الـ Index بتاعها
            option.innerText = `${section.name} - آية ${i}`;
            ayahSelect.appendChild(option);
        }
    });
    
    playbackControls.style.display = "block"; // إظهار شريط التحكم
    playAyah(currentIndex);
}

// دالة التحميل المسبق للآية التالية (عشان نلغي التقطيع)
function preloadNextAyah(index) {
    if (index + 1 < playlist.length) {
        const nextAyah = playlist[index + 1];
        const reciterFolder = reciterSelect.value;
        const s = String(nextAyah.surah).padStart(3, '0');
        const a = String(nextAyah.ayah).padStart(3, '0');
        preloader.src = `https://everyayah.com/data/${reciterFolder}/${s}${a}.mp3`;
        preloader.preload = "auto";
    }
}

function playAyah(index) {
    if (index < 0 || index >= playlist.length) {
        statusDiv.innerText = "انتهت التلاوة.";
        ayahImage.style.display = "none";
        return;
    }

    currentIndex = index;
    ayahSelect.value = currentIndex; // تحديث القائمة المنسدلة لتطابق الآية الحالية

    const currentAyah = playlist[currentIndex];
    const reciterFolder = reciterSelect.value;
    
    statusDiv.innerText = `جاري تشغيل: ${currentAyah.surahName} - آية رقم ${currentAyah.ayah}`;

    const surahAudioFormatted = String(currentAyah.surah).padStart(3, '0');
    const ayahAudioFormatted = String(currentAyah.ayah).padStart(3, '0');
    const audioUrl = `https://everyayah.com/data/${reciterFolder}/${surahAudioFormatted}${ayahAudioFormatted}.mp3`;

    const imageUrl = `https://everyayah.com/data/images_png/${currentAyah.surah}_${currentAyah.ayah}.png`;

    audioPlayer.src = audioUrl;
    ayahImage.src = imageUrl;
    ayahImage.style.display = "block"; 
    
    audioPlayer.play().catch(err => {
        console.error("مشكلة في تشغيل الآية:", err);
        setTimeout(playNext, 1500); 
    });

    // استدعاء التحميل المسبق للآية اللي جاية في الخلفية
    preloadNextAyah(currentIndex);
}

// دوال التنقل
function playNext() {
    if (currentIndex + 1 < playlist.length) playAyah(currentIndex + 1);
}

function playPrev() {
    if (currentIndex - 1 >= 0) playAyah(currentIndex - 1);
}

// ربط الأحداث بالأزرار
playBtn.addEventListener('click', buildPlaylistAndPlay);
nextBtn.addEventListener('click', playNext);
prevBtn.addEventListener('click', playPrev);
audioPlayer.addEventListener('ended', playNext);

// لما المستخدم يختار آية من القائمة المنسدلة
ayahSelect.addEventListener('change', (e) => {
    playAyah(parseInt(e.target.value));
});
