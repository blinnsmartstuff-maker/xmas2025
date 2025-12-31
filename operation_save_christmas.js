(function(){
  // ---------------------------------
  // Helpers
  // ---------------------------------
  function pad2(n){ return String(n).padStart(2,'0'); }

  function getCSTNow(){
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  }

  function getTimeRemainingToMidnight(){
    const cst = getCSTNow();
    const midnight = new Date(cst);
    midnight.setHours(24,0,0,0);
    const diff = midnight - cst;
    return Math.max(0, diff);
  }

  function formatHMS(ms){
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  // ---------------------------------
  // Mission metadata
  // ---------------------------------
  const missionMeta = {
    1: { title: "Algorithm Restored",      desc: "Stabilize the Naughty/Nice core." },
    2: { title: "Rogue Elf Apprehended",   desc: "Identify and contain the saboteur." },
    3: { title: "Flight Path Restored",    desc: "Rebuild Santa’s route to launch." },
    4: { title: "Santa Cleared for Takeoff", desc: "Final checks and lockbox access." }
  };

  // Shorter objective text (TV-friendly)
  const objectivesByStep = {
    1: ["Puzzle A", "Puzzle B", "Puzzle C"],
    2: ["Puzzle A", "Puzzle B", "Puzzle C"],
    3: ["Puzzle A", "Puzzle B", "Puzzle C"],
    4: ["Puzzle A", "Puzzle B", "Puzzle C"]
  };

  const orderRiddleByStep = {
    1: "The algorithm favors balance, not impulse. Begin where virtue is least, end where virtue is greatest.",
    2: "Not all numbers are alike. First, those that play fair. Then, those that do not.",
    3: "The journey does not begin at the start. Follow the path as it would be flown — from the farthest point back home.",
    4: "The final code demands stability. Center first. Balance on either side."
  };

  // ---------------------------------
  // DOM
  // ---------------------------------
  const params = new URLSearchParams(window.location.search);
  const stageRaw = (params.get('stage') || '').toString().trim().toLowerCase();

  const successOverlay = document.getElementById('successOverlay');
  const failureOverlay = document.getElementById('failureOverlay');
  const successTimeEl  = document.getElementById('successTime');

  const header    = document.getElementById('header');
  const subtitle  = document.getElementById('subtitle');
  const countdown = document.getElementById('countdown');

  const missionList = document.getElementById('missionList');
  const detailTitle = document.getElementById('detailTitle');
  const detailDesc  = document.getElementById('detailDesc');
  const detailObjectives = document.getElementById('detailObjectives');
  const detailRiddle = document.getElementById('detailRiddle');

  let endStateShown = false;

  // ---------------------------------
  // Stage overrides
  // ---------------------------------
  if (stageRaw === 'success') {
    showSuccessOverlay(true);
    return;
  }
  if (stageRaw === 'failure') {
    showFailureOverlay(true);
    return;
  }

  // ---------------------------------
  // Normal stage handling
  // ---------------------------------
  const stageNum = parseInt(stageRaw || '0', 10);
  const clamped = Math.max(0, Math.min(4, isNaN(stageNum) ? 0 : stageNum));

  // Colors with Stage 1/3 swapped: 1=gold, 3=green
  const colors = {
    0: '#7a0b12',  // red
    1: '#b8860b',  // orange/gold
    2: '#0057a4',  // blue
    3: '#006b2d',  // green
    4: '#ffffff'   // white
  };
  const textColors = {
    0: '#f2f2f2',
    1: '#f2f2f2',
    2: '#f2f2f2',
    3: '#f2f2f2',
    4: '#111111'
  };

  document.body.style.background = colors[clamped];
  document.body.style.color = textColors[clamped];

  // Render the split UI
  renderSplitUI(clamped);

  // Countdown loop (also triggers fail at midnight)
  function updateClock(){
    const remaining = getTimeRemainingToMidnight();
    if (countdown) {
      if (remaining <= 0) countdown.textContent = "00:00:00 until midnight";
      else countdown.textContent = `${formatHMS(remaining)} until midnight`;
    }

    // If time is out, decide outcome
    if (remaining <= 0) {
      if (clamped < 4) showFailureOverlay(false);
      else showSuccessOverlay(false);
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // If stage=4, do NOT auto-show success immediately anymore (you later wanted a twist).
  // Keeping your previous behavior would override your new idea.
  // If you want it back, uncomment below:
  // if (clamped === 4) setTimeout(() => showSuccessOverlay(false), 2500);

  // ---------------------------------
  // Split UI renderer
  // ---------------------------------
  function renderSplitUI(currentStage){
    // currentStage: 0..4
    // Active mission = currentStage+1 (unless complete)
    const activeMission = (currentStage < 4) ? (currentStage + 1) : 4;

    // Left panel missions
    if (missionList) {
      missionList.innerHTML = [1,2,3,4].map(m => {
        const meta = missionMeta[m];
        const done = m <= currentStage;
        const active = (currentStage < 4) && (m === activeMission);

        const stateCls = done ? "done" : (active ? "active" : "pending");
        const badge = done ? "✔" : String(m);

        return `
          <div class="missionItem ${stateCls}" data-mission="${m}">
            <div class="missionBadge">${badge}</div>
            <div class="missionText">
              <div class="missionTitle">${meta.title}</div>
              <div class="missionMini">${meta.desc}</div>
            </div>
          </div>
        `;
      }).join("");
    }

    // Right panel details (active mission only)
    const meta = missionMeta[activeMission];
    if (detailTitle) detailTitle.textContent = meta?.title || "--";
    if (detailDesc)  detailDesc.textContent  = meta?.desc || "--";

    // Objectives list
    const items = objectivesByStep[activeMission] || [];
    const isComplete = (currentStage >= 4);
    if (detailObjectives) {
      detailObjectives.innerHTML = items.map((txt, i) => {
        // if mission is done, show checks; if active, bullets; if future, dim bullets
        const missionDone = activeMission <= currentStage;
        const bullet = missionDone ? "✔" : "•";
        const cls = missionDone ? "done" : "active";
        return `<li class="${cls}"><span class="bullet">${bullet}</span><span>${txt}</span></li>`;
      }).join("");
      if (isComplete) {
        // If complete, keep it clean
        detailObjectives.innerHTML = `<li class="done"><span class="bullet">✔</span><span>All missions complete</span></li>`;
      }
    }

    // Riddle
    const riddleText = orderRiddleByStep[activeMission] || "--";
    if (detailRiddle) {
      const riddleTextEl = detailRiddle.querySelector('.riddleText');
      if (riddleTextEl) riddleTextEl.textContent = riddleText;
      if (isComplete) {
        if (riddleTextEl) riddleTextEl.textContent = "Stand by for next instructions.";
      }
    }
  }

  // ---------------------------------
  // Overlay handlers
  // ---------------------------------
  function hideMainUI(){
    // Split layout lives under #mainContent; hide it
    document.getElementById('mainContent')?.classList.add('hidden');
    header?.classList.add('hidden');
    subtitle?.classList.add('hidden');
  }

  function showSuccessOverlay(isOverride){
    if (endStateShown) return;
    endStateShown = true;

    const remaining = getTimeRemainingToMidnight();
    if (successTimeEl) {
      successTimeEl.textContent = isOverride ? "SUCCESS MODE" : formatHMS(remaining);
    }

    hideMainUI();

    if (countdown) countdown.textContent = isOverride ? "SUCCESS MODE" : `${formatHMS(remaining)} remaining`;

    document.body.style.background = "linear-gradient(135deg, #061a33, #b8860b)";
    document.body.style.color = "#ffffff";

    successOverlay?.classList.add('visible');
  }

  function showFailureOverlay(isOverride){
    if (endStateShown) return;
    endStateShown = true;

    hideMainUI();
    if (countdown) countdown.textContent = isOverride ? "FAILURE MODE" : "00:00:00 until midnight";

    document.body.style.background = "linear-gradient(135deg, #2b0000, #000000)";
    document.body.style.color = "#ffdddd";

    failureOverlay?.classList.add('visible');
  }
})();
