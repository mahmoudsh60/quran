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
const pauseBtn = document.getElementById('pauseBtn'); 

let audioPlayers = [document.getElementById('audioA'), document.getElementById('audioB')];
let currentPlayerIndex = 0; 
let isPaused = false;
let checkTimeInterval; // لضمان عدم تداخل الأوامر الزمنية

fetch('data.json?v=' + new Date().getTime())
    .then(r => r.json())
    .then(data => {
        quranData = data;
        data.reciters.forEach(r => {
            reciterSelect.add(new Option(r.name, r.folder));
        });
        data.topics.forEach(t => {
            topicSelect.add(new Option(t.title, t.id));
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
    
    if(checkTimeInterval) clearInterval(checkTimeInterval);

    currentIndex = index;
    ayahSelect.value = currentIndex;
    
    // ضبط حالة الزرار عند بدء آية جديدة
    isPaused = false;
    pauseBtn.innerText = "إيقاف ⏸️";
    pauseBtn.style.backgroundColor = "#e67e22";
    
    const nextPlayerIndex = (currentPlayerIndex + 1) % 2;
    const activePlayer = audioPlayers[currentPlayerIndex];
    const nextPlayer = audioPlayers[nextPlayerIndex];
    
    const item = playlist[index];
    statusDiv.innerText = `تلاوة: ${item.name} - آية ${item.ayah}`;
    ayahImage.src = `https://everyayah.com/data/images_png/${item.surah}_${item.ayah}.png`;
    ayahImage.style.display = "block";

    activePlayer.src = getAudioUrl(index);
    activePlayer.volume = 1;
    activePlayer.play().catch(e => console.log("تأخير في التحميل", e));

    if (index + 1 < playlist.length) {
        nextPlayer.src = getAudioUrl(index + 1);
        nextPlayer.pause(); 
    }

    // التداخل أصبح 0.3 ثانية، وزيادة سرعة الفحص لـ 50 ملي ثانية للدقة
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

// برمجة زرار الإيقاف والتشغيل
pauseBtn.onclick = () => {
    const activePlayer = audioPlayers[currentPlayerIndex];
    if (isPaused) {
        activePlayer.play();
        pauseBtn.innerText = "إيقاف ⏸️";
        pauseBtn.style.backgroundColor = "#e67e22"; // برتقالي
        isPaused = false;
    } else {
        activePlayer.pause();
        pauseBtn.innerText = "تشغيل ▶️";
        pauseBtn.style.backgroundColor = "#27ae60"; // أخضر
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
