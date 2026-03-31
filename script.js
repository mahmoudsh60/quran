let playlist = [];
let currentIndex = 0;
let reciterId = "";
const audioPlayer = document.getElementById('audioPlayer');
const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');

// قراءة البيانات من ملف JSON
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        reciterId = data.reciter; // معرف الشيخ
        const musaTopic = data.topics[0]; // سحب موضوع سيدنا موسى
        
        // توليد طابور التشغيل (الآيات بالترتيب)
        musaTopic.sections.forEach(section => {
            for(let i = section.start; i <= section.end; i++) {
                playlist.push({ surah: section.surah, ayah: i, surahName: section.name });
            }
        });
        statusDiv.innerText = `تم تحميل ${playlist.length} آية بنجاح.`;
    })
    .catch(error => console.error("Error loading JSON:", error));

// دالة لجلب وتشغيل الآية
function playAyah(index) {
    if (index >= playlist.length) {
        statusDiv.innerText = "انتهت القائمة.";
        return;
    }

    const currentAyah = playlist[index];
    statusDiv.innerText = `جاري تشغيل: ${currentAyah.surahName} - آية رقم ${currentAyah.ayah}`;

    // جلب رابط الصوت من الـ API
    fetch(`https://api.alquran.cloud/v1/ayah/${currentAyah.surah}:${currentAyah.ayah}/${reciterId}`)
        .then(response => response.json())
        .then(result => {
            if(result.data && result.data.audio) {
                audioPlayer.src = result.data.audio;
                audioPlayer.play();
            } else {
                statusDiv.innerText = "حدث خطأ في جلب الآية، جاري الانتقال للتالية...";
                playNext(); // تخطي في حالة الخطأ
            }
        })
        .catch(err => {
            console.error(err);
            playNext();
        });
}

// تشغيل الآية التالية تلقائياً عند انتهاء الحالية
function playNext() {
    currentIndex++;
    playAyah(currentIndex);
}

// ربط الأحداث
playBtn.addEventListener('click', () => {
    currentIndex = 0;
    playAyah(currentIndex);
});

audioPlayer.addEventListener('ended', playNext);