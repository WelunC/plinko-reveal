(() => {
      const canvas = document.getElementById("gameCanvas");
      const ctx = canvas.getContext("2d");

      const W = canvas.width;
      const H = canvas.height;

      const appEl = document.querySelector(".app");
      const sidebarEl = document.querySelector(".sidebar");
      const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
      const toggleSidebarFloatingBtn = document.getElementById("toggleSidebarFloatingBtn");

      const presetSelect = document.getElementById("presetSelect");
      const difficultySelect = document.getElementById("difficultySelect");
      const imageUrlsEl = document.getElementById("imageUrls");
      const imageFileInput = document.getElementById("imageFileInput");
      const imageScaleEl = document.getElementById("imageScale");
      const imageOffsetXEl = document.getElementById("imageOffsetX");
      const imageOffsetYEl = document.getElementById("imageOffsetY");
      const revealRadiusEl = document.getElementById("revealRadius");
      const imageScaleValue = document.getElementById("imageScaleValue");
      const imageOffsetXValue = document.getElementById("imageOffsetXValue");
      const imageOffsetYValue = document.getElementById("imageOffsetYValue");
      const revealRadiusValue = document.getElementById("revealRadiusValue");
      const imageStatus = document.getElementById("imageStatus");

      const scoreValue = document.getElementById("scoreValue");
      const dropTickerBtn = document.getElementById("dropTickerBtn");
      const ballsValue = document.getElementById("ballsValue");
      const lastResultValue = document.getElementById("lastResultValue");
      const revealedValue = document.getElementById("revealedValue");
      const personalBestValue = document.getElementById("personalBestValue");
      const personalBestDetails = document.getElementById("personalBestDetails");
      const allRecordsValue = document.getElementById("allRecordsValue");
      const clearRecordsBtn = document.getElementById("clearRecordsBtn");
      const rewardListEl = document.getElementById("rewardList");

      const dropCenterBtn = document.getElementById("dropCenterBtn");
      const newRoundBtn = document.getElementById("newRoundBtn");
      const resetBoardBtn = document.getElementById("resetBoardBtn");
      const applySettingsBtn = document.getElementById("applySettingsBtn");
      const clearImageBtn = document.getElementById("clearImageBtn");
      const loadRandomImageBtn = document.getElementById("loadRandomImageBtn");

      const configNameEl = document.getElementById("configName");
      const configJsonEl = document.getElementById("configJson");
      const exportConfigBtn = document.getElementById("exportConfigBtn");
      const importConfigBtn = document.getElementById("importConfigBtn");

      const BOARD_PRESETS = {
        tall: {
          key: "tall",
          name: "Tall",
          boardX: 140,
          boardY: 120,
          boardWidth: 720,
          boardHeight: 930,
          slotHeight: 115,
          pegRows: 13,
          pegSpacingX: 72,
          pegSpacingY: 62,
          pegRadius: 6,
          slotCount: 9
        },
        wide: {
          key: "wide",
          name: "Wide",
          boardX: 90,
          boardY: 150,
          boardWidth: 820,
          boardHeight: 840,
          slotHeight: 120,
          pegRows: 12,
          pegSpacingX: 78,
          pegSpacingY: 63,
          pegRadius: 6,
          slotCount: 10
        },
        compact: {
          key: "compact",
          name: "Compact Dense",
          boardX: 170,
          boardY: 140,
          boardWidth: 660,
          boardHeight: 860,
          slotHeight: 110,
          pegRows: 14,
          pegSpacingX: 64,
          pegSpacingY: 57,
          pegRadius: 6,
          slotCount: 8
        },
        gallery: {
          key: "gallery",
          name: "Gallery Framed",
          boardX: 120,
          boardY: 170,
          boardWidth: 760,
          boardHeight: 780,
          slotHeight: 130,
          pegRows: 11,
          pegSpacingX: 75,
          pegSpacingY: 62,
          pegRadius: 6,
          slotCount: 9
        }
      };

      const DEFAULT_REWARDS = [
        { label: "-50", type: "flat", value: 50 },
        { label: "-10", type: "flat", value: 10 },
        { label: "-20", type: "flat", value: 20 },
        { label: "-50", type: "flat", value: 50 },
        { label: "-20%", type: "percent", value: 20 },
        { label: "-10", type: "flat", value: 10 },
        { label: "-100", type: "flat", value: 100 },
        { label: "-20%", type: "percent", value: 20 },
        { label: "-100", type: "flat", value: 100 },
        { label: "-30", type: "flat", value: 30 }
      ];

      const physics = {
        gravity: 0.26,
        maxVy: 9,
        bounceX: 1.55,
        bounceY: 0.18,
        drift: 0.045,
        wallBounce: 0.82,
        ballRadius: 9,
        revealStepMin: 5
      };

      let currentPresetKey = "wide";
      let currentPreset = BOARD_PRESETS[currentPresetKey];

      let boardRect = null;
      let slotRect = null;
      let topDropY = 0;
      let pegs = [];

      let balls = [];
      const DIFFICULTIES = Object.freeze({
        easy: { startingPoints: 1500, revealRadius: 24 },
        normal: { startingPoints: 1000, revealRadius: 18 },
        hard: { startingPoints: 650, revealRadius: 12 }
      });
      const RECORDS_KEY = "plinko-reveal-high-scores-v1";
      let records = loadRecords();

      function loadRecords() {
        try {
          const saved = JSON.parse(localStorage.getItem(RECORDS_KEY) || "{}");
          if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
          const valid = {};
          for (const mode of Object.keys(DIFFICULTIES)) {
            const r = saved[mode];
            if (r && Number.isInteger(r.tenths) && r.tenths >= 0 && r.tenths <= 1000 &&
                Number.isFinite(r.points) && r.points >= 0 && Number.isInteger(r.balls) && r.balls > 0) {
              valid[mode] = { tenths: r.tenths, points: r.points, balls: r.balls };
            }
          }
          return valid;
        } catch (_) { return {}; }
      }

      function recordCurrentProgress() {
        if (ballsUsed === 0) return;
        const mode = config.difficulty;
        const tenths = Math.round((revealCount / (revealEstimateCols * revealEstimateRows)) * 1000);
        const old = records[mode];
        if (old && (tenths < old.tenths || (tenths === old.tenths && score <= old.points))) return;
        records[mode] = { tenths, points: score, balls: ballsUsed };
        try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); }
        catch (_) { /* Private browsing or storage restrictions: records last until reload. */ }
      }

      function renderRecords() {
        const best = records[config.difficulty];
        personalBestValue.textContent = best ? `${(best.tenths / 10).toFixed(1)}%` : "—";
        personalBestDetails.textContent = best ? `${best.points} points remaining · ${best.balls} balls` : "No attempts yet";
        allRecordsValue.textContent = Object.keys(DIFFICULTIES)
          .map(mode => `${mode[0].toUpperCase() + mode.slice(1)}: ${records[mode] ? (records[mode].tenths / 10).toFixed(1) + "%" : "—"}`)
          .join(" | ");
      }

      let score = DIFFICULTIES.normal.startingPoints;
      let ballsUsed = 0;
      let gameOver = false;
      let lastResult = "-";

      let rewardPool = [];
      let slotRewards = [];
      let revealedSlots = [];

      let hiddenImage = null;
      let hiddenImageSource = "";
      let fallbackPatternCanvas = null;
      let revealMask = null;
      let revealMaskCtx = null;

      let revealEstimateGrid = [];
      let revealEstimateCols = 100;
      let revealEstimateRows = 120;
      let revealCount = 0;

      let sidebarHidden = false;
      let tickerT = 0;
      let tickerDir = 1;
      let autoDropX = 0;

      const config = {
        name: "Example Reveal Board",
        preset: "wide",
        difficulty: "normal",
        imageUrls: [],
        imageSettings: {
          scale: 1,
          offsetX: 0,
          offsetY: 0
        },
        revealRadius: 18,
        rewards: DEFAULT_REWARDS.slice()
      };

      function rand(min, max) {
        return Math.random() * (max - min) + min;
      }

      function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
      }

      function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }

      function choice(arr) {
        if (!arr.length) return null;
        return arr[Math.floor(Math.random() * arr.length)];
      }

      function setStatus(msg, type = "") {
        imageStatus.textContent = msg;
        imageStatus.className = "status";
        if (type) imageStatus.classList.add(type);
      }

      function updateSidebarButtons() {
        const label = sidebarHidden ? "Show Left Panel" : "Hide Left Panel";
        if (toggleSidebarBtn) toggleSidebarBtn.textContent = label;
        if (toggleSidebarFloatingBtn) toggleSidebarFloatingBtn.textContent = label;
      }

      function setSidebarHidden(hidden) {
        sidebarHidden = hidden;
        appEl.classList.toggle("sidebar-hidden", hidden);
        if (sidebarEl) {
          sidebarEl.style.display = hidden ? "none" : "flex";
        }
        updateSidebarButtons();
      }

      function toggleSidebar() {
        setSidebarHidden(!sidebarHidden);
      }

      function updateAutoDropper() {
        const minX = boardRect.x + 26;
        const maxX = boardRect.x + boardRect.width - 26;
        if (!autoDropX) autoDropX = boardRect.x + boardRect.width / 2;

        autoDropX += tickerDir * 2.4;
        if (autoDropX <= minX) {
          autoDropX = minX;
          tickerDir = 1;
        } else if (autoDropX >= maxX) {
          autoDropX = maxX;
          tickerDir = -1;
        }
        tickerT += 0.04;
      }

      function getBoardRectFromPreset(preset) {
        return {
          x: preset.boardX,
          y: preset.boardY,
          width: preset.boardWidth,
          height: preset.boardHeight
        };
      }

      function getSlotRectFromPreset(preset) {
        return {
          x: preset.boardX,
          y: preset.boardY + preset.boardHeight,
          width: preset.boardWidth,
          height: preset.slotHeight
        };
      }

      function applyPreset(key) {
        currentPresetKey = key;
        currentPreset = BOARD_PRESETS[key];
        config.preset = key;

        boardRect = getBoardRectFromPreset(currentPreset);
        slotRect = getSlotRectFromPreset(currentPreset);
        topDropY = boardRect.y - 34;
        autoDropX = boardRect.x + boardRect.width / 2;

        generatePegs();
        createRevealMask();
        createRevealEstimate();
        createRewards();
      }

      function populatePresets() {
        presetSelect.innerHTML = "";
        for (const key of Object.keys(BOARD_PRESETS)) {
          const opt = document.createElement("option");
          opt.value = key;
          opt.textContent = BOARD_PRESETS[key].name;
          presetSelect.appendChild(opt);
        }
        presetSelect.value = currentPresetKey;
      }

      function generatePegs() {
        pegs = [];
        const centerX = boardRect.x + boardRect.width / 2;
        const startY = boardRect.y + 60;

        for (let row = 0; row < currentPreset.pegRows; row++) {
          const y = startY + row * currentPreset.pegSpacingY;
          const colsThisRow = row % 2 === 0 ? 9 : 8;
          const forceOffset = row === 0 ? currentPreset.pegSpacingX / 2 : 0;
          const rowWidth = (colsThisRow - 1) * currentPreset.pegSpacingX;
          const offset = row % 2 === 0 ? 0 : currentPreset.pegSpacingX / 2;
          const startX = centerX - rowWidth / 2 + offset * 0.5 + forceOffset;

          for (let c = 0; c < colsThisRow; c++) {
            const x = startX + c * currentPreset.pegSpacingX;
            if (x > boardRect.x + 20 && x < boardRect.x + boardRect.width - 20) {
              pegs.push({
                x,
                y,
                r: currentPreset.pegRadius
              });
            }
          }
        }
      }

      function makeFallbackImage() {
        fallbackPatternCanvas = document.createElement("canvas");
        fallbackPatternCanvas.width = W;
        fallbackPatternCanvas.height = H;
        const pctx = fallbackPatternCanvas.getContext("2d");

        const grad = pctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#173259");
        grad.addColorStop(0.25, "#5c2b8d");
        grad.addColorStop(0.52, "#b6376b");
        grad.addColorStop(0.75, "#f38f20");
        grad.addColorStop(1, "#fff26b");
        pctx.fillStyle = grad;
        pctx.fillRect(0, 0, W, H);

        for (let i = 0; i < 140; i++) {
          pctx.fillStyle = `hsla(${Math.floor(rand(0, 360))}, 85%, 72%, 0.18)`;
          pctx.beginPath();
          pctx.arc(rand(0, W), rand(0, H), rand(20, 90), 0, Math.PI * 2);
          pctx.fill();
        }

        pctx.save();
        pctx.translate(W / 2, H / 2);
        pctx.rotate(-0.1);
        pctx.textAlign = "center";
        pctx.fillStyle = "rgba(255,255,255,0.18)";
        pctx.font = "bold 124px Arial";
        pctx.fillText("REVEAL", 0, -20);
        pctx.font = "bold 88px Arial";
        pctx.fillText("PLACEHOLDER", 0, 92);
        pctx.restore();
      }

      function createRevealMask() {
        revealMask = document.createElement("canvas");
        revealMask.width = W;
        revealMask.height = H;
        revealMaskCtx = revealMask.getContext("2d");
        revealMaskCtx.clearRect(0, 0, W, H);
        revealMaskCtx.fillStyle = "rgba(0,0,0,0.99)";
        revealMaskCtx.fillRect(boardRect.x, boardRect.y, boardRect.width, boardRect.height);
      }

      function createRevealEstimate() {
        revealEstimateGrid = [];
        revealCount = 0;
        for (let y = 0; y < revealEstimateRows; y++) {
          revealEstimateGrid.push(new Array(revealEstimateCols).fill(false));
        }
      }

      function updateRevealEstimate(x, y, radius) {
        const cellW = boardRect.width / revealEstimateCols;
        const cellH = boardRect.height / revealEstimateRows;

        const minX = Math.floor((x - radius - boardRect.x) / cellW);
        const maxX = Math.floor((x + radius - boardRect.x) / cellW);
        const minY = Math.floor((y - radius - boardRect.y) / cellH);
        const maxY = Math.floor((y + radius - boardRect.y) / cellH);

        for (let gy = minY; gy <= maxY; gy++) {
          if (gy < 0 || gy >= revealEstimateRows) continue;
          for (let gx = minX; gx <= maxX; gx++) {
            if (gx < 0 || gx >= revealEstimateCols) continue;
            if (revealEstimateGrid[gy][gx]) continue;

            const cx = boardRect.x + gx * cellW + cellW / 2;
            const cy = boardRect.y + gy * cellH + cellH / 2;
            const dx = cx - x;
            const dy = cy - y;
            if (dx * dx + dy * dy <= radius * radius) {
              revealEstimateGrid[gy][gx] = true;
              revealCount++;
            }
          }
        }
      }

      function getRevealPercent() {
        const total = revealEstimateCols * revealEstimateRows;
        return ((revealCount / total) * 100).toFixed(1);
      }

      function getImageUrlList() {
        return imageUrlsEl.value
          .split("\n")
          .map(v => v.trim())
          .filter(Boolean);
      }

      function syncConfigFromControls() {
        config.name = configNameEl.value.trim() || "Untitled Reveal Board";
        config.preset = presetSelect.value;
        config.difficulty = difficultySelect.value;
        config.imageUrls = getImageUrlList();
        config.imageSettings.scale = Number(imageScaleEl.value);
        config.imageSettings.offsetX = Number(imageOffsetXEl.value);
        config.imageSettings.offsetY = Number(imageOffsetYEl.value);
        config.revealRadius = Number(revealRadiusEl.value);
      }

      function syncControlsFromConfig() {
        configNameEl.value = config.name || "Untitled Reveal Board";
        presetSelect.value = config.preset || "wide";
        difficultySelect.value = DIFFICULTIES[config.difficulty] ? config.difficulty : "normal";
        imageUrlsEl.value = (config.imageUrls || []).join("\n");
        imageScaleEl.value = String(config.imageSettings?.scale ?? 1);
        imageOffsetXEl.value = String(config.imageSettings?.offsetX ?? 0);
        imageOffsetYEl.value = String(config.imageSettings?.offsetY ?? 0);
        revealRadiusEl.value = String(config.revealRadius ?? 18);
        refreshSliderLabels();
      }

      function refreshSliderLabels() {
        imageScaleValue.textContent = Number(imageScaleEl.value).toFixed(2);
        imageOffsetXValue.textContent = String(Number(imageOffsetXEl.value));
        imageOffsetYValue.textContent = String(Number(imageOffsetYEl.value));
        revealRadiusValue.textContent = String(Number(revealRadiusEl.value));
      }

      function createRewards() {
  rewardPool = config.rewards.slice(0, currentPreset.slotCount);
  if (rewardPool.length < currentPreset.slotCount) {
    const filler = DEFAULT_REWARDS.slice();
    while (rewardPool.length < currentPreset.slotCount) {
      rewardPool.push(filler[rewardPool.length % filler.length]);
    }
  }
  slotRewards = shuffle(rewardPool);
  revealedSlots = new Array(currentPreset.slotCount).fill(false);
  renderRewards();
}

      function renderRewards() {
        rewardListEl.innerHTML = "";
        rewardPool.forEach(r => {
          const pill = document.createElement("div");
          pill.className = "reward-pill";
          pill.textContent = r.label;
          rewardListEl.appendChild(pill);
        });
      }

      function resetRound() {
        gameOver = false;
        balls = [];
        score = DIFFICULTIES[config.difficulty].startingPoints;
        ballsUsed = 0;
        lastResult = "-";
        createRevealMask();
        createRevealEstimate();
        createRewards();
        updateUi();
      }

      function spawnBall(x) {
  if (gameOver || score <= 0) return false;
  const bx = clamp(x, boardRect.x + 16, boardRect.x + boardRect.width - 16);

  balls.push({
    x: bx,
    y: topDropY,
    vx: rand(-0.6, 0.6), // increase this slightly
    vy: 0,
    r: physics.ballRadius,
    alive: true,
    inSlots: false
  });
  return true;
}

      function revealAlongPath(x1, y1, x2, y2, radius) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / physics.revealStepMin));

        revealMaskCtx.save();
        revealMaskCtx.globalCompositeOperation = "destination-out";
        revealMaskCtx.fillStyle = "rgba(0,0,0,1)";

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = x1 + dx * t;
          const y = y1 + dy * t;

          if (x < boardRect.x || x > boardRect.x + boardRect.width || y < boardRect.y || y > boardRect.y + boardRect.height) {
            continue;
          }

          revealMaskCtx.beginPath();
          revealMaskCtx.arc(x, y, radius, 0, Math.PI * 2);
          revealMaskCtx.fill();
          updateRevealEstimate(x, y, radius);
        }

        revealMaskCtx.restore();
      }

      function endRound() {
        if (gameOver) return;
        gameOver = true;
        balls = [];
        recordCurrentProgress();
        setStatus(`Game Over — ${getRevealPercent()}% revealed. Start a New Round to play again.`, "bad");
        updateUi();
      }

      function resolveBallReward(ball) {
  const slotWidth = slotRect.width / currentPreset.slotCount;
  const idx = clamp(Math.floor((ball.x - slotRect.x) / slotWidth), 0, currentPreset.slotCount - 1);
  const reward = slotRewards[idx];
  if (!reward) return;

  revealedSlots[idx] = true;

  if (reward.type === "flat") {
    score = Math.max(0, score - reward.value);
  } else if (reward.type === "percent") {
    score = Math.max(0, Math.round(score * (1 - reward.value / 100)));
  }

  lastResult = reward.label;
  if (score <= 0) endRound();
}

      function updateBalls() {
  if (gameOver) return;
  const revealRadius = Number(revealRadiusEl.value);
  const slotWidth = slotRect.width / currentPreset.slotCount;

  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    if (!b.alive) {
      balls.splice(i, 1);
      continue;
    }

    const prevX = b.x;
    const prevY = b.y;

    b.vy += physics.gravity;
    if (b.vy > physics.maxVy) b.vy = physics.maxVy;
    b.vx += rand(-physics.drift, physics.drift);

    // Extra top jitter so balls do not fall straight down dead lanes
    if (b.y < boardRect.y + 150) {
      b.vx += rand(-0.15, 0.15);
    }

    // Peg collisions
    for (const peg of pegs) {
      const dx = b.x - peg.x;
      const dy = b.y - peg.y;
      const minDist = b.r + peg.r;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        b.x += nx * overlap;
        b.y += ny * overlap;

        const side = nx >= 0 ? 1 : -1;
        b.vx += side * physics.bounceX * rand(0.85, 1.15);
        b.vy = Math.max(-0.5, b.vy * physics.bounceY);
        b.vx += rand(-0.15, 0.15);
      }
    }

    b.x += b.vx;
    b.y += b.vy;

    // Board walls
    if (b.x - b.r < boardRect.x) {
      b.x = boardRect.x + b.r;
      b.vx = Math.abs(b.vx) * physics.wallBounce;
    }
    if (b.x + b.r > boardRect.x + boardRect.width) {
      b.x = boardRect.x + boardRect.width - b.r;
      b.vx = -Math.abs(b.vx) * physics.wallBounce;
    }

    // Slot divider collisions once inside slot area
    if (b.y + b.r >= slotRect.y) {
      b.inSlots = true;

      for (let s = 1; s < currentPreset.slotCount; s++) {
        const dividerX = slotRect.x + s * slotWidth;

        if (
          b.x + b.r > dividerX - 2 &&
          b.x - b.r < dividerX + 2 &&
          b.y + b.r > slotRect.y
        ) {
          if (b.x < dividerX) {
            b.x = dividerX - b.r - 2;
            b.vx = -Math.abs(b.vx) * 0.65;
          } else {
            b.x = dividerX + b.r + 2;
            b.vx = Math.abs(b.vx) * 0.65;
          }
        }
      }

      b.vx *= 0.985;
    }

    revealAlongPath(prevX, prevY, b.x, b.y, revealRadius);

    if (b.y + b.r >= slotRect.y + slotRect.height - 16) {
      resolveBallReward(b);
      if (gameOver) return;
      b.alive = false;
    }

    if (b.y > H + 60) {
      b.alive = false;
    }
  }
}

      function drawFittedImage(targetCtx, img, dx, dy, dWidth, dHeight, scale, offsetX, offsetY) {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        const baseScale = Math.max(dWidth / iw, dHeight / ih);
        const finalScale = baseScale * scale;

        const drawW = iw * finalScale;
        const drawH = ih * finalScale;
        const drawX = dx + (dWidth - drawW) / 2 + offsetX;
        const drawY = dy + (dHeight - drawH) / 2 + offsetY;

        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.rect(dx, dy, dWidth, dHeight);
        targetCtx.clip();
        targetCtx.drawImage(img, drawX, drawY, drawW, drawH);
        targetCtx.restore();
      }

      function drawBackgroundImage() {
        const scale = Number(imageScaleEl.value);
        const offsetX = Number(imageOffsetXEl.value);
        const offsetY = Number(imageOffsetYEl.value);

        if (hiddenImage && hiddenImage.complete) {
          drawFittedImage(
            ctx,
            hiddenImage,
            boardRect.x,
            boardRect.y,
            boardRect.width,
            boardRect.height,
            scale,
            offsetX,
            offsetY
          );
        } else {
          drawFittedImage(
            ctx,
            fallbackPatternCanvas,
            boardRect.x,
            boardRect.y,
            boardRect.width,
            boardRect.height,
            scale,
            offsetX,
            offsetY
          );
        }
      }

      function drawCover() {
        ctx.drawImage(revealMask, 0, 0);
      }

      function drawBoardFrame() {
        ctx.save();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#6c6c6c";
        ctx.strokeRect(boardRect.x, boardRect.y, boardRect.width, boardRect.height);

        const shine = ctx.createLinearGradient(0, boardRect.y, 0, boardRect.y + 40);
        shine.addColorStop(0, "rgba(255,255,255,0.16)");
        shine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = shine;
        ctx.fillRect(boardRect.x, boardRect.y, boardRect.width, 40);

        ctx.restore();
      }

      function drawPegs() {
        for (const peg of pegs) {
          const g = ctx.createRadialGradient(
            peg.x - 2, peg.y - 2, 1,
            peg.x, peg.y, peg.r + 5
          );
          g.addColorStop(0, "#ffffff");
          g.addColorStop(0.35, "#dadada");
          g.addColorStop(1, "#6a6a6a");

          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(0,0,0,0.45)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      function drawSlots() {
  const slotWidth = slotRect.width / currentPreset.slotCount;

  for (let i = 0; i < currentPreset.slotCount; i++) {
    const x = slotRect.x + i * slotWidth;

    ctx.fillStyle = "#161616";
    ctx.fillRect(x + 1, slotRect.y, slotWidth - 2, slotRect.height);

    ctx.strokeStyle = "#4b4b4b";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, slotRect.y, slotWidth - 2, slotRect.height);

    // Red divider rails
    ctx.strokeStyle = "rgba(255,100,100,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, slotRect.y + 8);
    ctx.lineTo(x + 8, slotRect.y + slotRect.height - 34);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + slotWidth - 8, slotRect.y + 8);
    ctx.lineTo(x + slotWidth - 8, slotRect.y + slotRect.height - 34);
    ctx.stroke();

    // Slot label
    const known = revealedSlots[i];
    const reward = slotRewards[i];
    const label = known && reward ? reward.label : "?";

    ctx.fillStyle = known ? "#ffe082" : "#dcdcdc";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + slotWidth / 2, slotRect.y + slotRect.height / 2 - 8);
  }

  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(slotRect.x, slotRect.y + slotRect.height - 28, slotRect.width, 28);

  ctx.fillStyle = "#dedede";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Hidden Slots", slotRect.x + slotRect.width / 2, slotRect.y + slotRect.height - 8);
}

      function drawBalls() {
        for (const b of balls) {
          const g = ctx.createRadialGradient(
            b.x - 3, b.y - 3, 2,
            b.x, b.y, b.r + 2
          );
          g.addColorStop(0, "#fff7d1");
          g.addColorStop(0.35, "#ffd54a");
          g.addColorStop(1, "#cb8400");

          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(0,0,0,0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      function drawAutoDropper() {
        const bobY = Math.sin(tickerT) * 2;
        const holderY = topDropY - 18 + bobY;

        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(boardRect.x, topDropY - 30);
        ctx.lineTo(boardRect.x + boardRect.width, topDropY - 30);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "rgba(255,211,77,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(autoDropX, topDropY - 30);
        ctx.lineTo(autoDropX, holderY - 12);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,211,77,0.95)";
        ctx.beginPath();
        ctx.arc(autoDropX, holderY, physics.ballRadius + 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(0,0,0,0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      function drawDropGuide() {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(boardRect.x, topDropY);
        ctx.lineTo(boardRect.x + boardRect.width, topDropY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Click near this line to drop", boardRect.x + boardRect.width / 2, topDropY - 11);
        ctx.restore();
      }

      function drawBackgroundBase() {
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(0, 0, W, H);
      }

      function updateUi() {
        scoreValue.textContent = String(score);
        dropCenterBtn.disabled = gameOver;
        dropTickerBtn.disabled = gameOver;
        ballsValue.textContent = String(ballsUsed);
        lastResultValue.textContent = lastResult;
        revealedValue.textContent = `${getRevealPercent()}%`;
        recordCurrentProgress();
        renderRecords();
      }

      function render() {
        drawBackgroundBase();
        drawBackgroundImage();
        drawCover();
        drawBoardFrame();
        drawPegs();
        drawSlots();
        drawBalls();
        drawAutoDropper();
        drawDropGuide();
        updateUi();
      }

      function loop() {
        updateAutoDropper();
        updateBalls();
        render();
        requestAnimationFrame(loop);
      }

      function getCanvasCoords(evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (evt.clientX - rect.left) * scaleX,
          y: (evt.clientY - rect.top) * scaleY
        };
      }

      function tryLoadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Image failed to load"));

          img.src = url;
        });
      }

      async function loadRandomImageFromUrls() {
        syncConfigFromControls();
        const urls = config.imageUrls.slice();

        if (!urls.length) {
          setStatus("No image URLs provided. Using fallback image instead.", "bad");
          hiddenImage = null;
          hiddenImageSource = "";
          return;
        }

        const shuffled = shuffle(urls);

        setStatus("Trying image URLs...", "");
        for (const url of shuffled) {
          try {
            const img = await tryLoadImageFromUrl(url);
            hiddenImage = img;
            hiddenImageSource = url;
            setStatus(`Loaded image from URL: ${url}`, "good");
            return;
          } catch (err) {
            // try next
          }
        }

        hiddenImage = null;
        hiddenImageSource = "";
        setStatus("Could not load any provided URL image. This is often caused by hotlink/CORS restrictions.", "bad");
      }

      function loadImageFromFile(file) {
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          hiddenImage = img;
          hiddenImageSource = file.name || "local-file";
          setStatus(`Loaded local image: ${hiddenImageSource}`, "good");
          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          setStatus("Failed to load local image.", "bad");
          URL.revokeObjectURL(url);
        };

        img.src = url;
      }

      function exportConfig() {
        syncConfigFromControls();
        const data = {
          name: config.name,
          preset: config.preset,
          difficulty: config.difficulty,
          imageUrls: config.imageUrls,
          imageSettings: {
            scale: config.imageSettings.scale,
            offsetX: config.imageSettings.offsetX,
            offsetY: config.imageSettings.offsetY
          },
          revealRadius: config.revealRadius,
          rewards: config.rewards.slice(0, currentPreset.slotCount)
        };
        configJsonEl.value = JSON.stringify(data, null, 2);
      }

      function importConfig() {
        let data;
        try {
          data = JSON.parse(configJsonEl.value);
        } catch (err) {
          setStatus("Config JSON is invalid.", "bad");
          return;
        }

        config.name = data.name || "Imported Reveal Board";
        config.preset = data.preset && BOARD_PRESETS[data.preset] ? data.preset : "wide";
        config.difficulty = DIFFICULTIES[data.difficulty] ? data.difficulty : "normal";
        config.imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : [];
        config.imageSettings = {
          scale: Number(data.imageSettings?.scale ?? 1),
          offsetX: Number(data.imageSettings?.offsetX ?? 0),
          offsetY: Number(data.imageSettings?.offsetY ?? 0)
        };
        const importedRadius = Number(data.revealRadius);
        config.revealRadius = Number.isFinite(importedRadius) && importedRadius >= 6 && importedRadius <= 40
          ? importedRadius
          : DIFFICULTIES[config.difficulty].revealRadius;
        config.rewards = Array.isArray(data.rewards) && data.rewards.length
          ? data.rewards
          : DEFAULT_REWARDS.slice();

        syncControlsFromConfig();
        applyPreset(config.preset);
        resetRound();
        setStatus("Imported config.", "good");
      }

      function applySettings() {
        syncConfigFromControls();
        applyPreset(config.preset);
        resetRound();
        setStatus("Applied current settings.", "good");
      }

      function getDefaultConfigJson() {
        const initial = {
          name: config.name,
          preset: config.preset,
          difficulty: config.difficulty,
          imageUrls: config.imageUrls,
          imageSettings: {
            scale: config.imageSettings.scale,
            offsetX: config.imageSettings.offsetX,
            offsetY: config.imageSettings.offsetY
          },
          revealRadius: config.revealRadius,
          rewards: config.rewards.slice(0, currentPreset.slotCount)
        };
        return JSON.stringify(initial, null, 2);
      }

      function hookEvents() {
        clearRecordsBtn.addEventListener("click", () => {
          if (!window.confirm("Clear all saved high scores for Easy, Normal, and Hard?")) return;
          records = {};
          try { localStorage.removeItem(RECORDS_KEY); }
          catch (_) { /* Storage may be unavailable. */ }
          renderRecords();
          setStatus("Saved high scores cleared.", "good");
        });

        difficultySelect.addEventListener("change", () => {
          const difficulty = DIFFICULTIES[difficultySelect.value];
          if (!difficulty) return;
          revealRadiusEl.value = String(difficulty.revealRadius);
          refreshSliderLabels();
          syncConfigFromControls();
          resetRound();
          setStatus(`Difficulty set to ${difficultySelect.options[difficultySelect.selectedIndex].text.split(" — ")[0]}. New round started.`, "good");
        });

        presetSelect.addEventListener("change", () => {
          syncConfigFromControls();
          applyPreset(presetSelect.value);
          resetRound();
          setStatus(`Preset changed to ${BOARD_PRESETS[presetSelect.value].name}.`, "good");
        });

        imageScaleEl.addEventListener("input", refreshSliderLabels);
        imageOffsetXEl.addEventListener("input", refreshSliderLabels);
        imageOffsetYEl.addEventListener("input", refreshSliderLabels);
        revealRadiusEl.addEventListener("input", refreshSliderLabels);

        applySettingsBtn.addEventListener("click", applySettings);

        toggleSidebarBtn.addEventListener("click", toggleSidebar);
        toggleSidebarFloatingBtn.addEventListener("click", toggleSidebar);

        resetBoardBtn.addEventListener("click", () => {
          resetRound();
          setStatus("Board reset.", "good");
        });

        newRoundBtn.addEventListener("click", async () => {
          resetRound();
          if (getImageUrlList().length) {
            await loadRandomImageFromUrls();
          }
          setStatus("Started new round.", "good");
        });

        dropCenterBtn.addEventListener("click", () => {
          if (spawnBall(boardRect.x + boardRect.width / 2)) {
            ballsUsed++;
            updateUi();
          }
        });

        dropTickerBtn.addEventListener("click", () => {
          if (spawnBall(autoDropX || (boardRect.x + boardRect.width / 2))) {
            ballsUsed++;
            updateUi();
          }
        });

        clearImageBtn.addEventListener("click", () => {
          hiddenImage = null;
          hiddenImageSource = "";
          setStatus("Using fallback image.", "good");
        });

        loadRandomImageBtn.addEventListener("click", async () => {
          await loadRandomImageFromUrls();
        });

        imageFileInput.addEventListener("change", e => {
          const file = e.target.files && e.target.files[0];
          if (file) loadImageFromFile(file);
        });

        exportConfigBtn.addEventListener("click", () => {
          exportConfig();
          setStatus("Exported config JSON.", "good");
        });

        importConfigBtn.addEventListener("click", () => {
          importConfig();
        });

        canvas.addEventListener("click", evt => {
          const { x, y } = getCanvasCoords(evt);
          const nearTop = y >= topDropY - 40 && y <= topDropY + 60;
          const insideX = x >= boardRect.x && x <= boardRect.x + boardRect.width;

          if (nearTop && insideX) {
            if (spawnBall(x)) {
              ballsUsed++;
              updateUi();
            }
          }
        });
      }

      function init() {
  makeFallbackImage();

  config.imageUrls = [
    "https://i.imgur.com/PqZfPDc.jpeg"
  ];

  populatePresets();
  syncControlsFromConfig();
  refreshSliderLabels();
  applyPreset(currentPresetKey);
  resetRound();
  configJsonEl.value = getDefaultConfigJson();
  hookEvents();
  setSidebarHidden(false);
  loadRandomImageFromUrls();
  loop();
}

      init();
    })();
