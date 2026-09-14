// Core Engine for VoiceCraft Studio

const audioEl = document.getElementById('audioElement');
const captionBox = document.getElementById('captionBox');
const engagementCard = document.getElementById('engagementCard');

let timelineData = [];
let subsTimes = [];
let wordsArray = [];
let currentWordIndex = -1;
let animFrameId = null;
let isRecording = false;

// We'll expose a global launchStudio function to be called from UI
window.launchStudio = async function(config) {
  // Parse and set data
  try {
    timelineData = JSON.parse(config.timelineText);
  } catch (e) {
    alert("Invalid JSON in timeline.");
    return;
  }
  
  subsTimes = config.subsTimes.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  
  if (config.audioFile) {
    audioEl.src = URL.createObjectURL(config.audioFile);
  } else if (!audioEl.src) {
    alert("Please select an audio file first.");
    return;
  }

  // Pre-process timeline into words for finer granularity if needed, 
  // or just use blocks. The original code just used the whole text block or words?
  // Let's split by space to render words if we want kinetic typography.
  wordsArray = [];
  timelineData.forEach((block, bIdx) => {
    // We treat the block text as one item, but for 'pop' or 'kinetic' we can split.
    // To match original, we split into words and animate them in.
    const words = block.text.split(' ');
    // We roughly distribute the time among words if we only have block time
    const nextTime = bIdx < timelineData.length - 1 ? timelineData[bIdx + 1].time : block.time + 5;
    const duration = nextTime - block.time;
    const timePerWord = duration / words.length;
    
    words.forEach((w, wIdx) => {
      wordsArray.push({
        text: w,
        time: block.time + (wIdx * timePerWord),
        blockId: bIdx
      });
    });
  });

  // Start Countdown
  const cdStage = document.getElementById('countdownStage');
  const cdDigit = document.getElementById('countdownDigit');
  cdStage.style.display = 'flex';
  
  // Try Native Fullscreen
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(err => console.log(err));
  }
  
  let count = 5;
  cdDigit.innerText = count;
  
  const cdInterval = setInterval(() => {
    count--;
    if (count > 0) {
      cdDigit.innerText = count;
    } else {
      clearInterval(cdInterval);
      cdStage.style.display = 'none';
      startPlayback();
    }
  }, 1000);
}

function startPlayback() {
  isRecording = true;
  captionBox.innerHTML = '';
  currentWordIndex = -1;
  
  audioEl.currentTime = 0;
  audioEl.play().catch(e => console.error("Audio play failed:", e));
  
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(syncLoop);
}

function syncLoop() {
  if (!isRecording) return;
  
  const ct = audioEl.currentTime;
  
  // Update Subtitles
  // Find which block we are currently in
  let currentBlockId = -1;
  for (let i = timelineData.length - 1; i >= 0; i--) {
    if (ct >= timelineData[i].time) {
      currentBlockId = i;
      break;
    }
  }

  // If block changed, re-render caption box
  const currentBoxBlock = captionBox.getAttribute('data-block-id');
  if (currentBlockId !== -1 && currentBoxBlock != currentBlockId) {
    renderBlock(currentBlockId);
    captionBox.setAttribute('data-block-id', currentBlockId);
  }

  // Active Word Highlight
  // Find current word
  let activeWIdx = -1;
  for (let i = wordsArray.length - 1; i >= 0; i--) {
    if (ct >= wordsArray[i].time) {
      activeWIdx = i;
      break;
    }
  }
  
  if (activeWIdx !== -1 && activeWIdx !== currentWordIndex) {
    currentWordIndex = activeWIdx;
    const wElems = document.querySelectorAll('.w-item');
    wElems.forEach(el => {
      const idx = parseInt(el.getAttribute('data-widx'));
      if (idx <= activeWIdx) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  // Engagement Overlay
  let showEng = false;
  for (let t of subsTimes) {
    if (ct >= t && ct <= t + 10) { // show for 10 seconds
      showEng = true;
      break;
    }
  }
  if (showEng) {
    engagementCard.classList.add('visible');
  } else {
    engagementCard.classList.remove('visible');
  }

  animFrameId = requestAnimationFrame(syncLoop);
}

function renderBlock(blockId) {
  captionBox.innerHTML = '';
  const blockWords = wordsArray.filter(w => w.blockId === blockId);
  
  const frag = document.createDocumentFragment();
  blockWords.forEach(w => {
    const span = document.createElement('span');
    span.className = 'w-item';
    // Find index in main array
    const wIdx = wordsArray.indexOf(w);
    span.setAttribute('data-widx', wIdx);
    span.innerText = w.text;
    frag.appendChild(span);
  });
  captionBox.appendChild(frag);
}

// Controls
window.pauseStudio = function() {
  isRecording = false;
  audioEl.pause();
  if (document.exitFullscreen && document.fullscreenElement) {
    document.exitFullscreen().catch(e => {});
  }
}

// Touch Gestures
let lastTap = 0;
document.getElementById('studioCanvas').addEventListener('touchend', (e) => {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 300 && tapLength > 0) {
    // Double tap
    window.pauseStudio();
    document.getElementById('setupDrawer').classList.add('open');
  } else {
    // Single tap (toggle UI if needed, for now just hides top bar to be pure cinematic)
    const topBar = document.getElementById('ui-brand-bar');
    const dock = document.getElementById('ui-dock');
    if (topBar.classList.contains('hidden')) {
      topBar.classList.remove('hidden');
      dock.classList.remove('hidden');
    } else {
      topBar.classList.add('hidden');
      dock.classList.add('hidden');
    }
  }
  lastTap = currentTime;
});
