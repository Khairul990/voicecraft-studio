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

  // Timeline Mode Toggle
  let activeTimelineMode = 'builder';
  const modeBtns = document.querySelectorAll('.tm-btn');
  const builderMode = document.getElementById('builderMode');
  const rawMode = document.getElementById('rawMode');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTimelineMode = btn.dataset.mode;
      if (activeTimelineMode === 'builder') {
        builderMode.style.display = 'block';
        rawMode.style.display = 'none';
      } else {
        builderMode.style.display = 'none';
        rawMode.style.display = 'block';
      }
    });
  });

  // Generate Timeline Blocks
  const generateBlocksBtn = document.getElementById('generateBlocksBtn');
  const scriptInput = document.getElementById('scriptInput');
  const blocksContainer = document.getElementById('timelineBlocksContainer');
  let currentSyncIndex = 0;

  generateBlocksBtn.addEventListener('click', () => {
    const lines = scriptInput.value.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;
    
    blocksContainer.innerHTML = '';
    currentSyncIndex = 0;
    
    lines.forEach((line, idx) => {
      const block = document.createElement('div');
      block.className = 't-block';
      block.innerHTML = `
        <div class="t-block-idx">${idx + 1}</div>
        <input type="text" class="t-block-text" value="${line.replace(/"/g, '&quot;')}" />
        <input type="number" class="t-block-time" step="0.1" value="0.0" />
        <button class="t-block-sync" data-idx="${idx}">Sync</button>
      `;
      blocksContainer.appendChild(block);
    });

    // Add sync listeners
    document.querySelectorAll('.t-block-sync').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const timeInput = e.target.previousElementSibling;
        timeInput.value = window.audioElementRef.currentTime.toFixed(2);
        e.target.classList.add('synced');
        e.target.innerText = 'Synced';
        
        // Highlight next
        document.querySelectorAll('.t-block').forEach(b => b.classList.remove('active-sync'));
        const nextBlock = e.target.parentElement.nextElementSibling;
        if (nextBlock) {
          nextBlock.classList.add('active-sync');
          nextBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
    
    // Highlight first
    const firstBlock = blocksContainer.querySelector('.t-block');
    if (firstBlock) firstBlock.classList.add('active-sync');
  });

  // Config Object
  const config = {
    audioFile: null,
    storyTitle: document.getElementById('storyTitleInput').value,
    timelineText: document.getElementById('timelineInput').value,
    subsTimes: document.getElementById('subsInput').value
  };

  // Media
  const audioInput = document.getElementById('audioInput');
  const audioEl = document.getElementById('audioElement');
  window.audioElementRef = audioEl; // expose for sync buttons

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
    const theme = e.target.value;
    studioCanvas.setAttribute('data-theme', theme);
    const modes = ['mode-gold', 'mode-emerald', 'mode-pop', 'mode-depth', 'mode-luxury', 'mode-amber', 'mode-dynamic'];
    modes.forEach(m => studioCanvas.classList.remove(m));
    if (theme !== 'mode-dynamic') {
      studioCanvas.classList.add(theme);
    }
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
    // Unlock Audio Context for strict browsers
    if (audioEl.src) {
        audioEl.play().then(() => audioEl.pause()).catch(e => {});
    }

    setupDrawer.classList.remove('open');
    
    if (activeTimelineMode === 'builder') {
      const blocks = document.querySelectorAll('.t-block');
      if (blocks.length > 0) {
        // Compile blocks into JSON
        const compiledData = [];
        blocks.forEach(block => {
          const text = block.querySelector('.t-block-text').value;
          const time = parseFloat(block.querySelector('.t-block-time').value) || 0;
          compiledData.push({ time, text });
        });
        config.timelineText = JSON.stringify(compiledData);
        // update the raw textarea too just in case
        document.getElementById('timelineInput').value = JSON.stringify(compiledData, null, 2);
      } else {
        // Fallback to Raw JSON if builder is empty
        config.timelineText = document.getElementById('timelineInput').value;
      }
    } else {
      config.timelineText = document.getElementById('timelineInput').value;
    }
    
    config.subsTimes = document.getElementById('subsInput').value;
    config.storyTitle = document.getElementById('storyTitleInput').value;
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
