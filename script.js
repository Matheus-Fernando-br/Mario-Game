/* script.js - movimento por requestAnimationFrame, colisão por bounding boxes,
   velocidade aumenta a cada 1000 pontos sem reset de cenário. */

(() => {
  const board = document.querySelector('.game-board');
  const mario = document.querySelector('.mario');
  const pipe = document.querySelector('.pipe');
  const clouds = document.querySelector('.clouds');
  const piso = document.querySelector('.piso');
  const playBtn = document.querySelector('.play');
  const frase = document.querySelector('.frase');
  const scoreEl = document.querySelector('.score');

  // estado do jogo
  let isPlaying = false;
  let rafId = null;
  let lastTs = null;

  // dimensões atualizadas em runtime
  let boardW = 0;
  let boardH = 0;
  let pipeW = 0;

  // posições e velocidades (px por segundo)
  let pipeX = 0;              // posição atual do pipe (left em px dentro do board)
  let pipeSpeed = 0;          // px/s (vai aumentar com o tempo)
  let bgOffset = 0;           // offset do background (nuvens/piso)
  let bgSpeed = 0;            // px/s (nuvens e piso têm mesma velocidade)

  // configuração inicial
  const initialPipeDuration = 2.5; // segundos para o pipe atravessar a tela inicialmente
  const initialBgDuration = 10;    // segundos para bg "dar a volta" inicialmente
  const spawnGapFactor = 0.8;      // quando pipe atravessar, reseta para boardW + boardW*factor
  const scoreRate = 100;           // pontos por segundo (aprox, igual sua versão anterior)
  let score = 0;
  let scoreAccumulator = 0;
  const difficultyStep = 500;     // a cada 1000 pontos aumenta velocidade
  let nextSpeedThreshold = difficultyStep;
  const speedIncreaseFactor = 1.15; // fator multiplicador a cada threshold
  const minPipeDuration = 1.0;     // para não ficar absurdo

  // util
  function updateSizes() {
    const r = board.getBoundingClientRect();
    boardW = r.width;
    boardH = r.height;

    // garantir que o pipe já tenha tamanho carregado
    const pipeRect = pipe.getBoundingClientRect();
    pipeW = pipeRect.width || (boardW * 0.08);

    // velocidade inicial (px/s) calculada a partir do tempo que queremos que o pipe demore
    const travelDistance = boardW + pipeW + boardW * spawnGapFactor; // distância do spawn até sumir
    pipeSpeed = travelDistance / initialPipeDuration;
    bgSpeed = boardW / initialBgDuration;

    // setamos pipeX fora da tela (estado inicial pausado)
    pipeX = boardW + 60;
    pipe.style.left = `${pipeX}px`;

    // reset backgrounds
    bgOffset = 0;
    clouds.style.backgroundPosition = `0px 0px`;
    piso.style.backgroundPosition = `0px 0px`;
  }

  // iniciar JOGO (quando clicar em Play ou apertar espaço)
  function startGame() {
    // se já está jogando, ignora
    if (isPlaying) return;

    // recalcula tamanhos para o estado atual da viewport
    updateSizes();

    // reset de estado
    isPlaying = true;
    lastTs = null;
    score = 0;
    scoreAccumulator = 0;
    nextSpeedThreshold = difficultyStep;

    // velocidades iniciais (não alteram posição atual)
    // pipeSpeed e bgSpeed já estão definidos em updateSizes()

    // posicoes iniciais visuais
    pipeX = boardW + 60;
    pipe.style.left = `${pipeX}px`;

    // mario volta ao sprite vivo
    mario.src = './Images/mario.gif';
    mario.style.bottom = '20vh'; // conforme seu requisito
    mario.style.left = '3vw';

    // esconder overlays
    frase.classList.add('hidden');
    playBtn.classList.add('hidden');

    // reset background offset (começa do 0)
    bgOffset = 0;
    clouds.style.backgroundPosition = `0px 0px`;
    piso.style.backgroundPosition = `0px 0px`;

    // atualizar score visual
    scoreEl.textContent = `SCORE: 0`;

    // iniciar loop
    rafId = requestAnimationFrame(loop);
  }

  function endGame(collisionData) {
    // collisionData não é necessário, usamos bounding boxes já obtidas antes de chamar endGame
    // congelar estado
    isPlaying = false;
    cancelAnimationFrame(rafId);
    rafId = null;

    // congelar pipe (fixamos left)
    pipe.style.left = `${pipeX}px`;

    // garantir que o BG pare (mantemos offset atual)
    clouds.style.backgroundPosition = `${-Math.floor(bgOffset)}px 0px`;
    piso.style.backgroundPosition = `${-Math.floor(bgOffset)}px 0px`;

    // pegar bounding para posicionar o mario da mesma forma em que morreu
    const boardRect = board.getBoundingClientRect();
    const marioRect = mario.getBoundingClientRect();

    // bottom relativo ao container (em px) = boardRect.bottom - marioRect.bottom
    const bottomPx = Math.max(0, Math.round(boardRect.bottom - marioRect.bottom));
    mario.style.bottom = `${bottomPx}px`; // congela a posição vertical onde ele estava

    // reduzir o Mario morto (para não ficar gigante) e trocar a imagem
    mario.src = './Images/game-over.png';
    mario.style.width = '8.5vw';
    mario.style.left = '6vw'; // garante que não mudou
    mario.style.bottom = `${bottomPx}px`; // garante que não mudou

    // mostrar overlays: frase + play (com z-index alto)
    setTimeout(() => {
      frase.classList.remove('hidden');
      playBtn.classList.remove('hidden');
    }, 250);
  }

  // loop principal: desloca pipe, bg, atualiza score, detecta colisão
  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000; // segundos
    lastTs = ts;

    // mover pipe
    pipeX -= pipeSpeed * dt;
    pipe.style.left = `${Math.round(pipeX)}px`;

    // quando pipe sair à esquerda => respawn (sem reset do resto)
    if (pipeX < -pipeW) {
      // reset para depois da tela com gap
      pipeX = boardW + Math.round(boardW * (0.4 + Math.random() * 0.6)); // spawn aleatório entre 0.4..1.0 * boardW
      pipe.style.left = `${Math.round(pipeX)}px`;
    }

    // mover bg (nuvens e piso) com mesmo offset (mesma velocidade)
    bgOffset += bgSpeed * dt;
    // modulo pra evitar número gigante; usamos boardW como referência de loop
    if (bgOffset > boardW) bgOffset -= boardW;
    clouds.style.backgroundPosition = `${-Math.floor(bgOffset)}px 0px`;
    piso.style.backgroundPosition = `${-Math.floor(bgOffset)}px 0px`;

    // atualizar score de forma suave (scoreRate pontos por segundo)
    scoreAccumulator += scoreRate * dt;
    if (scoreAccumulator >= 1) {
      const inc = Math.floor(scoreAccumulator);
      score += inc;
      scoreAccumulator -= inc;
      scoreEl.textContent = `SCORE: ${score}`;
    }

    // a cada threshold de pontos, aumentar velocidade SEM resetar cenário
    if (score >= nextSpeedThreshold) {
      nextSpeedThreshold += difficultyStep;
      // multiplicar velocidades (pipe e bg)
      pipeSpeed *= speedIncreaseFactor;
      bgSpeed *= speedIncreaseFactor;
      // limitador para não ir a loucura (se quiser ajustar)
      // (não reseta pipeX nem bgOffset)
    }

    // detectar colisão usando bounding boxes reais
    const marioRect = mario.getBoundingClientRect();
    const pipeRect = pipe.getBoundingClientRect();
    // colisão se overlap nas duas dimensões
    const collided = !(
      marioRect.right < pipeRect.left ||
      marioRect.left > pipeRect.right ||
      marioRect.bottom < pipeRect.top ||
      marioRect.top > pipeRect.bottom
    );

    if (collided) {
      endGame();
      return; // não solicita novo RAF
    }

    // continua o loop
    rafId = requestAnimationFrame(loop);
  }

  // pulo (apertar espaço) — animação CSS apenas visual
  function jump() {
    if (!isPlaying) return;
    if (mario.classList.contains('jumpMario')) return;
    mario.classList.add('jumpMario');
    setTimeout(() => mario.classList.remove('jumpMario'), 600);
  }

  // listeners
  // espaço: se não estiver jogando => startGame, caso contrário => jump
  document.addEventListener('keydown', (ev) => {
    if (ev.code !== 'Space') return;
    ev.preventDefault();
    if (!isPlaying) startGame();
    else jump();
  });

  // play button (clicar para iniciar/reiniciar)
  playBtn.addEventListener('click', startGame);

  // on resize: recalcula dimensões e ajusta valores mínimos (não forza reset do jogo em andamento)
  window.addEventListener('resize', () => {
    // atualiza boardW/boardH e pipeW, e recalcula velocidades base proporcionais ao novo tamanho
    const prevBoardW = boardW;
    updateSizes();
    // se o jogo está em andamento, só recalcular pipeSpeed e bgSpeed proporcionalmente
    if (isPlaying && prevBoardW > 0) {
      // ajusta pipeSpeed e bgSpeed proporcionalmente ao novo boardW
      // mantém a mesma "duração" aparente convertendo: velocidade proporcional a boardW
      // (isso evita reset de posições)
      // calcula fator de escala e aplica
      const scale = boardW / Math.max(prevBoardW, 1);
      pipeSpeed *= scale;
      bgSpeed *= scale;
    }
  });

  // inicializa em estado pausado com play visível
  window.addEventListener('load', () => {
    updateSizes();
    // garantir score inicial
    scoreEl.textContent = 'SCORE: 0';
    frase.classList.add('hidden');
    playBtn.classList.remove('hidden');
    isPlaying = false;
  });

})();
