document.addEventListener('DOMContentLoaded', () => {
  const setupDrawer = document.getElementById('setupDrawer');
  // Open drawer initially
  setupDrawer.classList.add('open');

  // Tabs Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  // Config Object
  const config = {
    audioFile: null,
    timelineText: document.getElementById('timelineInput').value,
    subsTimes: document.getElementById('subsInput').value
  };

  // Media
  const audioInput = document.getElementById('audioInput');
  const audioEl = document.getElementById('audioElement');
  const audioScrubber = document.getElementById('audioScrubber');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');
  const timelineInput = document.getElementById('timelineInput');

  audioInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      config.audioFile = e.target.files[0];
      const url = URL.createObjectURL(config.audioFile);
      audioEl.src = url;
      audioEl.onloadedmetadata = () => {
        audioScrubber.max = audioEl.duration;
      };
    }
  });

  // Scrubber Logic
  audioScrubber.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioEl.currentTime = val;
    currentTimeDisplay.innerText = val.toFixed(1) + 's';
  });
  
  let isDraggingScrubber = false;
  audioScrubber.addEventListener('mousedown', () => isDraggingScrubber = true);
  audioScrubber.addEventListener('mouseup', () => isDraggingScrubber = false);
  
  audioEl.addEventListener('timeupdate', () => {
    if (!isDraggingScrubber && audioEl.duration) {
      audioScrubber.value = audioEl.currentTime;
      currentTimeDisplay.innerText = audioEl.currentTime.toFixed(1) + 's';
    }
  });

  // Set Timestamp
  document.getElementById('setTimestampBtn').addEventListener('click', () => {
    // Basic insert at cursor in textarea
    const ct = audioEl.currentTime.toFixed(2);
    const startPos = timelineInput.selectionStart;
    const endPos = timelineInput.selectionEnd;
    const val = timelineInput.value;
    timelineInput.value = val.substring(0, startPos) + ct + val.substring(endPos, val.length);
  });

  // Theme & Style
  const studioCanvas = document.getElementById('studioCanvas');
  const stageContainer = document.getElementById('stageContainer');
  
  document.getElementById('ratioSelect').addEventListener('change', (e) => {
    stageContainer.className = e.target.value;
  });

  document.getElementById('themeSelect').addEventListener('change', (e) => {
    studioCanvas.className = e.target.value;
  });

  const fontSelect = document.getElementById('fontSelect');
  const dynamicFont = document.getElementById('dynamic-font');
  fontSelect.addEventListener('change', (e) => {
    const family = e.target.value;
    // Update link
    const urlName = family.replace(' ', '+');
    dynamicFont.href = `https://fonts.googleapis.com/css2?family=${urlName}:wght@500;600;700;800&display=swap`;
    document.documentElement.style.setProperty('--font-main', `'${family}', sans-serif`);
  });

  document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--caption-font-size', e.target.value + 'rem');
  });

  // Branding
  const logoInput = document.getElementById('logoInput');
  logoInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        document.getElementById('brand-logo-img').src = evt.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  document.getElementById('chNameInput').addEventListener('input', (e) => {
    document.getElementById('display-ch-name').innerText = e.target.value;
  });
  document.getElementById('chHandleInput').addEventListener('input', (e) => {
    document.getElementById('display-ch-handle').innerText = e.target.value;
  });
  document.getElementById('verifyCheck').addEventListener('change', (e) => {
    document.getElementById('display-verify').style.display = e.target.checked ? 'flex' : 'none';
  });
  document.getElementById('headlineInput').addEventListener('input', (e) => {
    document.getElementById('display-headline').innerText = e.target.value;
  });

  // Start Button
  document.getElementById('startBtn').addEventListener('click', () => {
    setupDrawer.classList.remove('open');
    config.timelineText = document.getElementById('timelineInput').value;
    config.subsTimes = document.getElementById('subsInput').value;
    window.launchStudio(config);
  });

  // Export Config
  document.getElementById('exportBtn').addEventListener('click', () => {
    const exportData = {
      timelineText: document.getElementById('timelineInput').value,
      subsTimes: document.getElementById('subsInput').value,
      chName: document.getElementById('chNameInput').value,
      chHandle: document.getElementById('chHandleInput').value,
      headline: document.getElementById('headlineInput').value,
      theme: document.getElementById('themeSelect').value,
      font: document.getElementById('fontSelect').value
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "voicecraft-config.json";
    a.click();
  });
});
