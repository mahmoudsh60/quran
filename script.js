let playlist = [];
let currentIndex = 0;
let quranData = {}; // هنحفظ فيها البيانات كلها

const reciterSelect = document.getElementById('reciterSelect');
const topicSelect = document.getElementById('topicSelect');
const audioPlayer = document.getElementById('audioPlayer');
const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');
const ayahImage = document.getElementById('ayahImage');

// 1. قراءة البيانات وبناء القوائم المنسدلة
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        quranData = data;
        
        // تعبئة قائمة الشيوخ
        data.reciters.forEach(reciter => {
            let option = document.createElement('option');
            option.value = reciter.folder;
            option.innerText = reciter.name;
            reciterSelect.appendChild(option);
        });

        // تعبئة قائمة المواضيع
        data.topics.forEach(topic => {
            let option = document.createElement('option');
            option.value = topic.id;
            option.innerText = topic.title;
            topicSelect.appendChild(option);
        });
    })
    .catch(error => console.error("Error loading JSON:", error));

// 2. دالة تجهيز قائمة التشغيل بناءً على اختيار المستخدم
function buildPlaylistAndPlay() {
    playlist = [];
    currentIndex = 0;
    
    const selectedTopicId = topicSelect.value;
    const selectedTopic = quranData.topics.find(t => t.id === selectedTopicId);
    
    // تفريغ الآيات في الطابور
    selectedTopic.sections.forEach(section => {
        for(let i = section.start; i <= section.end; i++) {
            playlist.push({ surah: section.surah, ayah: i, surahName: section.name });
        }
    });
    
    playAyah(currentIndex);
}

// 3. دالة تشغيل الآية وعرض صورتها
function playAyah(index) {
    if (index >= playlist.length) {
        statusDiv.innerText = "انتهت التلاوة لهذا الموضوع.";
        ayahImage.style.display = "none";
        return;
    }

    const currentAyah = playlist[index];
    const reciterFolder = reciterSelect.value;
    
    statusDiv.innerText = `جاري تشغيل: ${currentAyah.surahName} - آية رقم ${currentAyah.ayah}`;

    // تظبيط أرقام الصوت (تحتاج أصفار على اليسار)
    const surahAudioFormatted = String(currentAyah.surah).padStart(3, '0');
    const ayahAudioFormatted = String(currentAyah.ayah).padStart(3, '0');
    const audioUrl = `https://everyayah.com/data/${reciterFolder}/${surahAudioFormatted}${ayahAudioFormatted}.mp3`;

    // رابط الصورة من EveryAyah (لا تحتاج أصفار)
    const imageUrl = `https://everyayah.com/data/images_png/${currentAyah.surah}_${currentAyah.ayah}.png`;

    // تحديث المشغل والصورة
    audioPlayer.src = audioUrl;
    ayahImage.src = imageUrl;
    ayahImage.style.display = "block"; // إظهار الصورة
    
    audioPlayer.play().catch(err => {
        console.error("مشكلة في تشغيل الآية:", err);
        statusDiv.innerText = "جاري الانتقال للآية التالية...";
        setTimeout(playNext, 1500); 
    });
}

function playNext() {
    currentIndex++;
    playAyah(currentIndex);
}

// 4. ربط الأزرار بالأحداث
playBtn.addEventListener('click', buildPlaylistAndPlay);
audioPlayer.addEventListener('ended', playNext);
