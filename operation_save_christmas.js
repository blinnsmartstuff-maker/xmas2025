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
  // Objectives + Order Riddles (UPDATED NAMES)
  // ---------------------------------
  const objectivesByStep = {
    1: [
      "Puzzle A: Elf Party Incident Log (Naughty = 1, Nice = 2) → land on a 0",
      "Puzzle B: Tree Deduction Rules → find the single false statement",
      "Puzzle C: Missing Ingredient Cipher → solve 5 words, apply the recipe formula"
    ],
    2: [
      "Puzzle A: Route Overlay Map (Acetate) → identify the only valid route",
      "Puzzle B: Rule Compliance Check → confirm all constraints are satisfied",
      "Puzzle C: Map ID Extraction → report the route’s ID digit"
    ],
    3: [
      "Puzzle A: LEGO Row Assembly → order rows correctly to form the digit",
      "Puzzle B: Flip & Align Rows → mirror/rotate rows until the digit resolves",
      "Puzzle C: Color-Rule Verification → confirm your digit uses the required colors"
    ],
    4: [
      "Puzzle A: Signal Training Round → classify 10 sounds by frequency/duration/stability",
      "Puzzle B: Rule Reveal & Decode → convert your notes into digits",
      "Puzzle C: Final Lock Entry → unlock Box 4 and initiate the override"
    ]
  };

  const orderRiddleByStep = {
    1: "The algorithm favors balance, not impulse. Begin where virtue is least, end where virtue is greatest.",
    2: "Not all numbers are alike. First, those that play fair. Then, those that do not.",
    3: "The journey does not begin at the start. Follow the path as it would be flown — from the farthest point back home.",
    4: "The final code demands stability. Center first. Balance on either side."
  };

  function renderObjectivesAndRiddles(currentStage){
    // currentStage is 0..4
    document.querySelectorAll(".step").forEach(stepEl => {
      const stepNum = parseInt(stepEl.dataset.step, 10);
      const list = document.getElementById(`obj-${stepNum}`);
      const riddleBox = document.getElementById(`riddle-${stepNum}`);

      if (!list || !riddleBox) return;

      const isDone = stepNum <= currentStage;

      // stage=0 => mission 1 is active
      // stage=1 => mission 2 is active
      // stage=2 => mission 3 is active
      // stage=3 => mission 4 is active
      // stage=4 => complete (overtime trigger)
      const isActive = (currentStage < 4) && (stepNum === (currentStage + 1));

      // Card state classes
      stepEl.classList.toggle("active", isActive);

      // collapse (hide details) if not active
      stepEl.classList.toggle("collapsed", !isActive);

      const items = objectivesByStep[stepNum] || [];
      list.innerHTML = items.map((txt) => {
        const bullet = isDone ? "✔" : "•";
        const cls = isDone ? "done" : (isActive ? "active" : "pending");
        return `<li class="${cls}"><span class="bullet">${bullet}</span><span>${txt}</span></li>`;
      }).join("");

      const riddleText = orderRiddleByStep[stepNum] || "";
      riddleBox.innerHTML = `
        <div class="tag">Order Riddle</div>
        <div class="riddleText">${riddleText}</div>
      `;
    });
  }

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

  const tracker   = document.getElementById('tracker');
  const header    = document.getElementById('header');
  const subtitle  = document.getElementById('subtitle');
  const countdown = document.getElementById('countdown');
  const countdownLabel = document.getElementById('countdownLabel');
  const countdownWrap  = document.getElementById('countdownWrap');

  let endStateShown = false;
  let clockInterval = null;

  // ---------------------------------
  // Stage overrides (manual testing)
  // ---------------------------------
  if (stageRaw === 'success') {
    showSuccessOverlay(true);
    return;
  }
  if (stageRaw === 'failure') {
    showFailureOverlay(true);
    return;
  }

  // Manual testing for overtime mode
  if (stageRaw === 'overtime') {
    enterOvertimeMode(true);
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

  // Update tracker candy canes (done/filled)
  document.querySelectorAll('.step').forEach(step => {
    const num = parseInt(step.dataset.step, 10);
    if (num <= clamped) step.classList.add('done');
    else step.classList.remove('done');
  });

  // Objectives + riddles rendering + collapsing logic
  renderObjectivesAndRiddles(clamped);

  // If midnight already passed, fail immediately unless manually overridden
  if (getTimeRemainingToMidnight() <= 0 && clamped < 4) {
    showFailureOverlay(false);
    return;
  }

  // Normal midnight countdown loop (stops when overtime starts)
  function updateClock(){
    const remaining = getTimeRemainingToMidnight();

    if (countdown) {
      if (remaining <= 0) countdown.textContent = "00:00:00 until midnight";
      else countdown.textContent = `${formatHMS(remaining)} until midnight`;
    }

    // If time is out during missions 0-3, fail
    if (remaining <= 0 && clamped < 4) {
      showFailureOverlay(false);
    }
  }

  clockInterval = setInterval(updateClock, 1000);
  updateClock();

  // ---------------------------------
  // Stage 4 trigger → OVERTIME
  // ---------------------------------
  if (clamped === 4) {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }

    setTimeout(() => {
      document.body.classList.add('glitch');
      setTimeout(() => {
        document.body.classList.remove('glitch');
        enterOvertimeMode(false);
      }, 2200);
    }, 800);
  }

  // ---------------------------------
  // Overlay handlers
  // ---------------------------------
  function hideMainUI(){
    if (tracker) tracker.classList.add('hidden');
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
