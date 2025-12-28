(function(){
  // ---------------------------------
  // Helpers
  // ---------------------------------
  function pad2(n){ return String(n).padStart(2,'0'); }

  function getCSTNow(){
    // DST-safe Central Time
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
  // Objectives + Order Riddles
  // ---------------------------------
  const objectivesByStep = {
    1: [
      "Puzzle A: Apply the corrupted rules to classify behaviors",
      "Puzzle B: Identify the correct ornament set (two conditions)",
      "Puzzle C: Alphabetize Santa’s list and extract the index digit"
    ],
    2: [
      "Puzzle A: Identify the rogue elf from the statement cards",
      "Puzzle B: Spot the mislabeled gift tag and correct the unit",
      "Puzzle C: Decode the ELF acrostic transmission"
    ],
    3: [
      "Puzzle A: Align the overlay to reveal the X / coordinate",
      "Puzzle B: Order the reindeer correctly and extract the digit",
      "Puzzle C: Use the house as the map to locate the button"
    ],
    4: [
      "Puzzle A: Identify the mission pattern to produce a digit",
      "Puzzle B: Use the countdown clue to produce a digit",
      "Puzzle C: Apply the Santa constant to produce a digit"
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
      const isActive = (currentStage < 4) && (stepNum === (currentStage + 1)); // stage=0 means mission 1 is active

      stepEl.classList.toggle("active", isActive);

      // objectives
      const items = objectivesByStep[stepNum] || [];
      list.innerHTML = items.map((txt) => {
        const bullet = isDone ? "✔" : "•";
        const cls = isDone ? "done" : (isActive ? "active" : "pending");
        return `<li class="${cls}"><span class="bullet">${bullet}</span><span>${txt}</span></li>`;
      }).join("");

      // riddle
      const riddleText = orderRiddleByStep[stepNum] || "";
      riddleBox.innerHTML = `
        <div class="tag">Order Riddle</div>
        <div class="riddleText">${riddleText}</div>
      `;

      // Fade riddle when not active (CSS handles opacity)
    });
  }

  // ---------------------------------
  // DOM
  // ---------------------------------
  const params = new URLSearchParams(window.location.search);
  const stageRaw = (params.get('stage') || '').toString().trim().toLowerCase();

  const successOverlay = document.getElementById('successOverlay');
  const failureOverlay = document.getElementById('failureOverlay');
  const successTimeEl  = document.getElementById('successTime');

  const tracker   = document.getElementById('tracker');
  const header    = document.getElementById('header');
  const subtitle  = document.getElementById('subtitle');
  const countdown = document.getElementById('countdown');

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
    0: '#7a0b12',
    1: '#b8860b', // stage 1 gold/yellow
    2: '#0057a4',
    3: '#006b2d', // stage 3 green
    4: '#ffffff'
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

  // Objectives + riddles rendering
  renderObjectivesAndRiddles(clamped);

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

  // Auto-success if stage=4 (give them a beat to see completion)
  if (clamped === 4) {
    setTimeout(() => showSuccessOverlay(false), 2500);
  }

  // ---------------------------------
  // Overlay handlers
  // ---------------------------------
  function hideMainUI(){
    if (tracker) tracker.classList.add('hidden');
    if (header) header.classList.add('hidden');
    if (subtitle) subtitle.classList.add('hidden');
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
