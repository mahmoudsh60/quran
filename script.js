let playlist = [];
let currentIndex = 0;
const audioPlayer = document.getElementById('audioPlayer');
const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');

// قراءة البيانات من ملف JSON
fetch('data.json')
    .then(response => response.json())
    .then(data => {
        const musaTopic = data.topics[0]; 
        
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

    // تظبيط الأرقام عشان تناسب صيغة EveryAyah (إضافة أصفار على الشمال)
    // سورة 20 وآية 9 هتبقى 020009
    const surahFormatted = String(currentAyah.surah).padStart(3, '0');
    const ayahFormatted = String(currentAyah.ayah).padStart(3, '0');
    
    // رابط الشيخ ياسر الدوسري المباشر
    const audioUrl = `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${surahFormatted}${ayahFormatted}.mp3`;

    audioPlayer.src = audioUrl;
    
    // تشغيل الصوت مع التعامل مع أي تأخير في التحميل
    audioPlayer.play().catch(err => {
        console.error("مشكلة في تشغيل الآية:", err);
        statusDiv.innerText = "حدث خطأ في جلب الآية، جاري الانتقال للتالية...";
        setTimeout(playNext, 1500); // انتظار ثانية ونص قبل التخطي
    });
}

function playNext() {
    currentIndex++;
    playAyah(currentIndex);
}

playBtn.addEventListener('click', () => {
    currentIndex = 0;
    playAyah(currentIndex);
});

audioPlayer.addEventListener('ended', playNext);
