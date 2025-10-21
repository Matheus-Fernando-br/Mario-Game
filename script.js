(() => {
  const board = document.querySelector('.game-board');
  const mario = document.querySelector('.mario');
  const pipe = document.querySelector('.pipe');
  const clouds = document.querySelector('.clouds');
  const piso = document.querySelector('.piso');
  const playBtn = document.querySelector('.play');
  const frase = document.querySelector('.frase');
  const scoreEl = document.querySelector('.score');

  let isPlaying = false;
  let rafId = null;
  let lastTs = null;

  let boardW = 0, boardH = 0, pipeW = 0;
  let pipeX = 0, pipeSpeed = 0, bgOffset = 0, bgSpeed = 0;
  let score = 0, scoreAccumulator = 0;
  const scoreRate = 100;
  const difficultyStep = 500;
  let nextSpeedThreshold = difficultyStep;
  const speedIncreaseFactor = 1.15;

  // CONFIG DINÂMICA (ajusta pra telas pequenas)
  const isMobile = window.innerWidth <= 900;
  const initialPipeDuration = isMobile ? 2 : 2.5; // mais lento no mobile
  const initialBgDuration = isMobile ? 14 : 10;
  const spawnGapFactor = isMobile ? 0.9 : 0.8;
  const minPipeDuration = 1.2;

  function updateSizes() {
    const r = board.getBoundingClientRect();
    boardW = r.width;
    boardH = r.height;

    const pipeRect = pipe.getBoundingClientRect();
    pipeW = pipeRect.width || (boardW * 0.08);

    const travelDistance = boardW + pipeW + boardW * spawnGapFactor;
    pipeSpeed = travelDistance / initialPipeDuration;
    bgSpeed = boardW / initialBgDuration;

    pipeX = boardW + 60;
    pipe.style.left = `${pipeX}px`;
    bgOffset = 0;
    clouds.style.backgroundPosition = `0px 0px`;
    piso.style.backgroundPosition = `0px 0px`;
  }

  function startGame() {
    if (isPlaying) return;
    updateSizes();

    isPlaying = true;
    lastTs = null;
    score = 0;
    scoreAccumulator = 0;
    nextSpeedThreshold = difficultyStep;

    pipeX = boardW + 60;
    pipe.style.left = `${pipeX}px`;
    mario.src = './Images/mario.gif';
    mario.style.bottom = '20vh';
    mario.style.left = '3vw';

    frase.classList.add('hidden');
    playBtn.classList.add('hidden');
    bgOffset = 0;

    scoreEl.textContent = `SCORE: 0`;
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    isPlaying = false;
    cancelAnimationFrame(rafId);
    rafId = null;

    const boardRect = board.getBoundingClientRect();
    const marioRect = mario.getBoundingClientRect();
    const bottomPx = Math.max(0, Math.round(boardRect.bottom - marioRect.bottom));

    mario.src = './Images/game-over.png';
    if (window.innerWidth <= 900) mario.style.width = '18vw';
    else mario.style.width = '8.5vw';
    mario.style.left = '6vw';
    mario.style.bottom = `${bottomPx}px`;

    setTimeout(() => {
      frase.classList.remove('hidden');
      playBtn.classList.remove('hidden');
    }, 250);
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    pipeX -= pipeSpeed * dt;
    pipe.style.left = `${Math.round(pipeX)}px`;

    if (pipeX < -pipeW) {
      pipeX = boardW + Math.round(boardW * (0.5 + Math.random() * 0.5));
      pipe.style.left = `${Math.round(pipeX)}px`;
    }

    bgOffset += bgSpeed * dt;
    if (bgOffset > boardW) bgOffset -= boardW;
    clouds.style.backgroundPosition = `${-Math.floor(bgOffset)}px 0px`;
    piso.style.backgroundPosition = `${-Math.floor(bgOffset)}px 0px`;

    scoreAccumulator += scoreRate * dt;
    if (scoreAccumulator >= 1) {
      const inc = Math.floor(scoreAccumulator);
      score += inc;
      scoreAccumulator -= inc;
      scoreEl.textContent = `SCORE: ${score}`;
    }

    if (score >= nextSpeedThreshold) {
      nextSpeedThreshold += difficultyStep;
      pipeSpeed *= speedIncreaseFactor;
      bgSpeed *= speedIncreaseFactor;
    }

    // 📏 DETECÇÃO AJUSTADA (mais justa em mobile)
    const marioRect = mario.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();

    const collisionMargin = isMobile ? 10 : 5;
    const collided = !(
      marioRect.right - collisionMargin < pipeRect.left ||
      marioRect.left + collisionMargin > pipeRect.right ||
      marioRect.bottom < pipeRect.top + collisionMargin ||
      marioRect.top > pipeRect.bottom - collisionMargin
    );

    if (collided) {
      endGame();
      return;
    }

    rafId = requestAnimationFrame(loop);
  }

  function jump() {
    if (!isPlaying) return;
    if (mario.classList.contains('jumpMario')) return;
    mario.classList.add('jumpMario');
    setTimeout(() => mario.classList.remove('jumpMario'), 600);
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.code !== 'Space') return;
    ev.preventDefault();
    if (!isPlaying) startGame();
    else jump();
  });

  playBtn.addEventListener('click', startGame);
  window.addEventListener('resize', updateSizes);

  window.addEventListener('load', () => {
    updateSizes();
    scoreEl.textContent = 'SCORE: 0';
    frase.classList.add('hidden');
    playBtn.classList.remove('hidden');
    isPlaying = false;
  });
})();
