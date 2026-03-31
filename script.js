let playlist = [];
let currentIndex = 0;
let quranData = {}; 

const reciterSelect = document.getElementById('reciterSelect');
const topicSelect = document.getElementById('topicSelect');
const statusDiv = document.getElementById('status');
const playBtn = document.getElementById('playBtn');
const ayahImage = document.getElementById('ayahImage');
const playbackControls = document.getElementById('playbackControls');
const ayahSelect = document.getElementById('ayahSelect');

// المشغلات
let audioPlayers = [document.getElementById('audioA'), document.getElementById('audioB')];
let currentPlayerIndex = 0; // بيتبدل بين 0 و 1

fetch('data.json?v=' + new Date().getTime())
    .then(r => r.json())
    .then(data => {
        quranData = data;
        data.reciters.forEach(r => {
            let op = new Option(r.name, r.folder);
            reciterSelect.add(op);
        });
        data.topics.forEach(t => {
            let op = new Option(t.title, t.id);
            topicSelect.add(op);
        });
        statusDiv.innerText = "جاهز. اختر موضوعاً وابدأ.";
    });

function buildPlaylistAndPlay() {
    playlist = [];
    currentIndex = 0;
    ayahSelect.innerHTML = "";
    const selectedTopic = quranData.topics.find(t => t.id === topicSelect.value);
    
    selectedTopic.sections.forEach(section => {
        for(let i = section.start; i <= section.end; i++) {
            playlist.push({ surah: section.surah, ayah: i, name: section.name });
            ayahSelect.add(new Option(`${section.name} - ${i}`, playlist.length - 1));
        }
    });
    
    playbackControls.style.display = "block";
    playAyah(0);
}

function getAudioUrl(index) {
    const item = playlist[index];
    const s = String(item.surah).padStart(3, '0');
    const a = String(item.ayah).padStart(3, '0');
    return `https://everyayah.com/data/${reciterSelect.value}/${s}${a}.mp3`;
}

function playAyah(index) {
    if (index >= playlist.length) {
        statusDiv.innerText = "انتهى الموضوع.";
        return;
    }
    currentIndex = index;
    ayahSelect.value = currentIndex;
    
    const nextPlayerIndex = (currentPlayerIndex + 1) % 2;
    const activePlayer = audioPlayers[currentPlayerIndex];
    const nextPlayer = audioPlayers[nextPlayerIndex];
    
    const item = playlist[index];
    statusDiv.innerText = `تلاوة: ${item.name} - آية ${item.ayah}`;
    ayahImage.src = `https://everyayah.com/data/images_png/${item.surah}_${item.ayah}.png`;
    ayahImage.style.display = "block";

    // تشغيل الحالي
    activePlayer.src = getAudioUrl(index);
    activePlayer.volume = 1;
    activePlayer.play();

    // التحميل المسبق للآية التالية في المشغل التاني
    if (index + 1 < playlist.length) {
        nextPlayer.src = getAudioUrl(index + 1);
        nextPlayer.pause(); // نجهزه بس
    }

    // مراقبة الوقت للتبديل (قبل النهاية بـ 0.8 ثانية)
    const checkTime = setInterval(() => {
        if (activePlayer.duration - activePlayer.currentTime < 0.8) {
            clearInterval(checkTime);
            startTransition();
        }
    }, 100);
}

function startTransition() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= playlist.length) return;

    currentPlayerIndex = (currentPlayerIndex + 1) % 2;
    playAyah(nextIndex);
}

// أزرار التحكم
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
