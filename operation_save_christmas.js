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

  function formatMMSS(totalSeconds){
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${pad2(m)}:${pad2(s)}`;
  }

  // ---------------------------------
  // Mission content (shorter objectives)
  // ---------------------------------
  const missionMeta = {
    1: { title: "Algorithm Restored", desc: "Stabilize the Naughty/Nice core." },
    2: { title: "Rogue Elf Apprehended", desc: "Identify and contain the saboteur." },
    3: { title: "Flight Path Restored", desc: "Rebuild Santa’s route to launch." },
    4: { title: "Santa Cleared for Takeoff", desc: "Final checks and lockbox access." }
  };

  const objectivesByStep = {
    1: [
      "Elf Party Log (score the elf actions)",
      "Tree Deduction (spot the one false rule)",
      "Missing Ingredient (solve the formula)"
    ],
    2: [
      "Map Routes (find the only valid path)",
      "Rules Audit (confirm all constraints)",
      "Route ID (extract the digit)"
    ],
    3: [
      "LEGO Rows (order the strips)",
      "Flip & Align (resolve the digit)",
      "Color Rules (verify the build)"
    ],
    4: [
      "Sound Notes (listen + classify)",
      "Rule Reveal (decode to digits)",
      "Lockbox Entry (initiate override)"
    ]
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

  const overtimeOverlay = document.getElementById('overtimeOverlay');
  const overtimeTimerEl = document.getElementById('overtimeTimer');
  const overtimeForm    = document.getElementById('overtimeForm');
  const overtimeInput   = document.getElementById('overtimeInput');
  const overtimeMsg     = document.getElementById('overtimeMsg');

  const successOverlay = document.getElementById('successOverlay');
  const failureOverlay = document.getElementById('failureOverlay');
  const successTimeEl  = document.getElementById('successTime');

  const header    = document.getElementById('header');
  const subtitle  = document.getElementById('subtitle');
  const countdown = document.getElementById('countdown');
  const countdownLabel = document.getElementById('countdownLabel');
  const countdownWrap  = document.getElementById('countdownWrap');

  const missionItems = Array.from(document.querySelectorAll('.missionItem'));

  const activeTitle = document.getElementById('activeTitle');
  const activeDesc  = document.getElementById('activeDesc');
  const activeObjectives = document.getElementById('activeObjectives');
  const activeRiddle = document.getElementById('activeRiddle');

  let endStateShown = false;
  let clockInterval = null;

  // ---------------------------------
  // Stage overrides (manual testing)
  // ---------------------------------
  if (stageRaw === 'success') { showSuccessOverlay(true); return; }
  if (stageRaw === 'failure') { showFailureOverlay(true); return; }
  if (stageRaw === 'overtime') { enterOvertimeMode(true); return; }

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

  // If midnight already passed, fail immediately (unless already complete)
  if (getTimeRemainingToMidnight() <= 0 && clamped < 4) {
    showFailureOverlay(false);
    return;
  }

  // Render left list status + right panel content
  renderSplitUI(clamped);

  // Countdown loop (stops when overtime starts)
  function updateClock(){
    const remaining = getTimeRemainingToMidnight();

    if (countdown) {
      if (remaining <= 0) countdown.textContent = "00:00:00 until midnight";
      else countdown.textContent = `${formatHMS(remaining)} until midnight`;
    }

    if (remaining <= 0 && clamped < 4) {
      showFailureOverlay(false);
    }
  }

  clockInterval = setInterval(updateClock, 1000);
  updateClock();

  // Stage 4 trigger → glitch → overtime
  if (clamped === 4) {
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }

    setTimeout(() => {
      document.body.classList.add('glitch');
      setTimeout(() => {
        document.body.classList.remove('glitch');
        enterOvertimeMode(false);
      }, 2200);
    }, 800);
  }

  // ---------------------------------
  // Split UI rendering
  // ---------------------------------
  function renderSplitUI(currentStage){
    // currentStage = 0..4
    // Active mission is step = currentStage+1 (while <4). When stage=4, none active.
    const activeStep = (currentStage < 4) ? (currentStage + 1) : null;

    missionItems.forEach(el => {
      const step = parseInt(el.dataset.step, 10);
      const done = step <= currentStage;
      const active = (activeStep !== null && step === activeStep);

      el.classList.toggle('done', done);
      el.classList.toggle('active', active);
    });

    if (!activeStep) {
      // completed state (stage=4) – the overtime overlay will take over shortly
      if (activeTitle) activeTitle.textContent = "All Missions Complete";
      if (activeDesc) activeDesc.textContent = "Stand by...";
      if (activeObjectives) activeObjectives.innerHTML = "";
      if (activeRiddle) activeRiddle.textContent = "—";
      return;
    }

    const meta = missionMeta[activeStep] || { title: "—", desc: "—" };
    if (activeTitle) activeTitle.textContent = meta.title;
    if (activeDesc) activeDesc.textContent = meta.desc;

    const items = objectivesByStep[activeStep] || [];
    if (activeObjectives) {
      activeObjectives.innerHTML = items.map(txt => {
        return `<li class="active"><span class="bullet">•</span><span>${txt}</span></li>`;
      }).join("");
    }

    const r = orderRiddleByStep[activeStep] || "—";
    if (activeRiddle) activeRiddle.textContent = r;
  }

  // ---------------------------------
  // Overlay handlers
  // ---------------------------------
  function hideMainUI(){
    const splitShell = document.getElementById('splitShell');
    if (splitShell) splitShell.classList.add('hidden');
    if (header) header.classList.add('hidden');
    if (subtitle) subtitle.classList.add('hidden');
    if (countdownWrap) countdownWrap.classList.add('hidden');
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

  // ---------------------------------
  // OVERTIME MODE
  // ---------------------------------
  const OVERTIME_SECONDS = 10 * 60;
  const OVERTIME_PASSWORD = "midnight";
  let overtimeRemaining = OVERTIME_SECONDS;
  let overtimeInterval = null;

  function enterOvertimeMode(isOverride){
    if (endStateShown) return;
    if (!overtimeOverlay || !overtimeTimerEl || !overtimeForm || !overtimeInput || !overtimeMsg) {
      showSuccessOverlay(true);
      return;
    }

    hideMainUI();

    overtimeOverlay.classList.add('visible');
    overtimeOverlay.classList.remove('bad', 'ok', 'urgent');

    if (countdownLabel) countdownLabel.textContent = "Final Authorization Window";
    if (countdown) countdown.textContent = "10:00 remaining";

    overtimeRemaining = OVERTIME_SECONDS;
    overtimeTimerEl.textContent = formatMMSS(overtimeRemaining);
    overtimeMsg.textContent = "";

    setTimeout(() => overtimeInput.focus(), 200);

    overtimeInterval = setInterval(() => {
      overtimeRemaining -= 1;

      if (overtimeRemaining <= 0) {
        overtimeTimerEl.textContent = "00:00";
        clearInterval(overtimeInterval);
        overtimeInterval = null;
        showFailureOverlay(true);
        return;
      }

      overtimeTimerEl.textContent = formatMMSS(overtimeRemaining);

      if (overtimeRemaining === 60) {
        overtimeOverlay.classList.add('urgent');
      }
    }, 1000);

    if (!overtimeForm.dataset.bound) {
      overtimeForm.dataset.bound = "1";
      overtimeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = (overtimeInput.value || '').trim().toLowerCase();

        if (!val) return flashOvertimeBad("Enter a password.");

        if (val === OVERTIME_PASSWORD) {
          flashOvertimeOk("Authorization accepted.");
          if (overtimeInterval) {
            clearInterval(overtimeInterval);
            overtimeInterval = null;
          }
          setTimeout(() => showSuccessOverlay(true), 650);
        } else {
          flashOvertimeBad("Access denied.");
          overtimeInput.select();
        }
      });
    }
  }

  function flashOvertimeBad(msg){
    overtimeMsg.textContent = msg;
    overtimeOverlay.classList.remove('ok');
    overtimeOverlay.classList.add('bad');
    setTimeout(() => overtimeOverlay.classList.remove('bad'), 450);
  }

  function flashOvertimeOk(msg){
    overtimeMsg.textContent = msg;
    overtimeOverlay.classList.remove('bad');
    overtimeOverlay.classList.add('ok');
  }

})();
