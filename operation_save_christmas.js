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

  function formatMS(ms){
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${pad2(m)}:${pad2(s)}`;
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
    1: ["Elf Holiday Party", "O'Christmas Tree, O'Christmas Tree", "Naughty or Nice?"],
    2: ["False Trails in the Snow", "Workshop Shift Log", "Corner the Rogue Elf"],
    3: ["Navigation Key Recovery", "Flight Path Recovery", "Clear the Airspace!"],
    4: ["Radio Interference", "Sleigh Systems Startup", "Shield Encryption"]
  };

  const orderRiddleByStep = {
    1: "The algorithm favors balance, not impulse. Begin where virtue is least, end where virtue is greatest.",
    2: "Not all numbers are alike. First, those that play fair. Then, those that do not.",
    3: "The sleigh’s code sorts by magnitude: highest priority first. Zero waits at the end.",
    4: "The final code demands stability. Center first. Balance on either side."
  };

  // ---------------------------------
  // DOM
  // ---------------------------------
  const params = new URLSearchParams(window.location.search);
  const stageRaw = (params.get('stage') || '').toString().trim().toLowerCase();

  const successOverlay  = document.getElementById('successOverlay');
  const failureOverlay  = document.getElementById('failureOverlay');
  const overtimeOverlay = document.getElementById('overtimeOverlay');

  const successTimeEl   = document.getElementById('successTime');
  const overtimeTimeEl  = document.getElementById('overtimeTime');
  const overtimeInput   = document.getElementById('overtimeInput');
  const overtimeSubmit  = document.getElementById('overtimeSubmit');
  const overtimeMsg     = document.getElementById('overtimeMsg');

  const header    = document.getElementById('header');
  const subtitle  = document.getElementById('subtitle');
  const countdown = document.getElementById('countdown');
  const countdownLabel = document.getElementById('countdownLabel');

  const missionList = document.getElementById('missionList');
  const detailTitle = document.getElementById('detailTitle');
  const detailDesc  = document.getElementById('detailDesc');
  const detailObjectives = document.getElementById('detailObjectives');
  const detailRiddle = document.getElementById('detailRiddle');

  let endStateShown = false;
  let overtimeInterval = null;
  let clockInterval = null;

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

  renderSplitUI(clamped);

  // If stage=4 => trigger OVERTIME instead of midnight logic
  if (clamped === 4) {
    startOvertime();
    return;
  }

  // Otherwise, normal midnight countdown + auto-fail at midnight
  startMidnightCountdown();

  // ---------------------------------
  // Midnight countdown
  // ---------------------------------
  function startMidnightCountdown(){
    function updateClock(){
      const remaining = getTimeRemainingToMidnight();
      if (countdown) {
        if (remaining <= 0) countdown.textContent = "00:00:00 until midnight";
        else countdown.textContent = `${formatHMS(remaining)} until midnight`;
      }
      if (remaining <= 0) showFailureOverlay(false);
    }

    clockInterval = setInterval(updateClock, 1000);
    updateClock();
  }

  // ---------------------------------
  // OVERTIME (10 minute timer + password)
  // ---------------------------------
  function startOvertime(){
    // Replace countdown header text
    if (countdownLabel) countdownLabel.textContent = "OVERTIME";
    if (countdown) countdown.textContent = "10:00 remaining";

    // Persist overtime start so refresh doesn't reset it
    const KEY = "osc_overtime_start_ms";
    const DURATION_MS = 10 * 60 * 1000;

    let startMs = parseInt(localStorage.getItem(KEY) || "", 10);
    if (!Number.isFinite(startMs) || startMs <= 0) {
      startMs = Date.now();
      localStorage.setItem(KEY, String(startMs));
    }

    // Show overlay
    overtimeOverlay?.classList.add('visible');

    // Focus input for TV keyboard use
    setTimeout(() => overtimeInput?.focus(), 250);

    // Wire submit
    const correct = "midnight";
    function attempt(){
      const val = (overtimeInput?.value || "").trim().toLowerCase();
      if (!val) {
        setMsg("Enter the password.", true);
        wiggleInput();
        return;
      }
      if (val === correct) {
        // clear overtime state so it won't re-trigger on reload
        localStorage.removeItem(KEY);
        showSuccessOverlay(false);
        return;
      }
      setMsg("Incorrect. Try again.", true);
      wiggleInput();
      overtimeInput?.select();
    }

    overtimeSubmit?.addEventListener("click", attempt);
    overtimeInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attempt();
    });

    // Tick timer
    function tick(){
      const elapsed = Date.now() - startMs;
      const remaining = Math.max(0, DURATION_MS - elapsed);

      // Update HUD countdown AND overlay countdown
      const mmss = formatMS(remaining);
      if (countdown) countdown.textContent = `${mmss} remaining`;
      if (overtimeTimeEl) overtimeTimeEl.textContent = mmss;

      if (remaining <= 0) {
        localStorage.removeItem(KEY);
        showFailureOverlay(false);
      }
    }

    overtimeInterval = setInterval(tick, 250);
    tick();
  }

  function setMsg(text, isBad){
    if (!overtimeMsg) return;
    overtimeMsg.textContent = text;
    overtimeMsg.classList.toggle("bad", !!isBad);
  }

  function wiggleInput(){
    const wrap = document.querySelector(".passwordInputWrap");
    wrap?.classList.remove("wiggle");
    // force reflow
    void wrap?.offsetWidth;
    wrap?.classList.add("wiggle");
  }

  // ---------------------------------
  // Split UI renderer
  // ---------------------------------
  function renderSplitUI(currentStage){
    const activeMission = (currentStage < 4) ? (currentStage + 1) : 4;

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

    const meta = missionMeta[activeMission];
    if (detailTitle) detailTitle.textContent = meta?.title || "--";
    if (detailDesc)  detailDesc.textContent  = meta?.desc || "--";

    const items = objectivesByStep[activeMission] || [];
    if (detailObjectives) {
      const missionDone = activeMission <= currentStage;
      detailObjectives.innerHTML = items.map((txt) => {
        const bullet = missionDone ? "✔" : "•";
        const cls = missionDone ? "done" : "active";
        return `<li class="${cls}"><span class="bullet">${bullet}</span><span>${txt}</span></li>`;
      }).join("");
    }

    const riddleText = orderRiddleByStep[activeMission] || "--";
    if (detailRiddle) {
      const riddleTextEl = detailRiddle.querySelector('.riddleText');
      if (riddleTextEl) riddleTextEl.textContent = riddleText;
    }
  }

  // ---------------------------------
  // Overlay handlers
  // ---------------------------------
  function hideMainUI(){
    document.getElementById('mainContent')?.classList.add('hidden');
    header?.classList.add('hidden');
    subtitle?.classList.add('hidden');
  }

  function showSuccessOverlay(isOverride){
    if (endStateShown) return;
    endStateShown = true;

    cleanupTimers();

    const remaining = getTimeRemainingToMidnight();
    if (successTimeEl) {
      successTimeEl.textContent = isOverride ? "SUCCESS MODE" : formatHMS(remaining);
    }

    hideMainUI();

    if (countdownLabel) countdownLabel.textContent = "STATUS";
    if (countdown) countdown.textContent = isOverride ? "SUCCESS MODE" : `${formatHMS(remaining)} remaining`;

    document.body.style.background = "linear-gradient(135deg, #061a33, #b8860b)";
    document.body.style.color = "#ffffff";

    successOverlay?.classList.add('visible');
  }

  function showFailureOverlay(isOverride){
    if (endStateShown) return;
    endStateShown = true;

    cleanupTimers();

    hideMainUI();

    if (countdownLabel) countdownLabel.textContent = "STATUS";
    if (countdown) countdown.textContent = isOverride ? "FAILURE MODE" : "TIME EXPIRED";

    document.body.style.background = "linear-gradient(135deg, #2b0000, #000000)";
    document.body.style.color = "#ffdddd";

    failureOverlay?.classList.add('visible');
  }

  function cleanupTimers(){
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
    if (overtimeInterval) { clearInterval(overtimeInterval); overtimeInterval = null; }
  }
})();
